import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockBackend, mockApiInterceptor } from '../api/mock-api.interceptor';
import { CommentPromptService } from '../ui/comment-prompt';
import { ToastService } from '../ui/toast.service';
import { RequestsStore } from './requests.store';
import { TransitionService, UNDO_WINDOW_MS } from './transition.service';

const BRUNO = { name: 'Bruno Lima', role: 'reviewer' } as const;
const LATENCY = 600;

async function setup() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(withInterceptors([mockApiInterceptor]))],
  });
  const store = TestBed.inject(RequestsStore);
  store.load();
  await vi.advanceTimersByTimeAsync(LATENCY);
  return {
    store,
    service: TestBed.inject(TransitionService),
    backend: TestBed.inject(MockBackend),
    toast: TestBed.inject(ToastService),
  };
}

const find = (store: RequestsStore, id: string) => {
  const request = store.requests().find((item) => item.id === id);
  if (!request) throw new Error(`${id} missing`);
  return request;
};

describe('TransitionService', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('applies an undoable decision on screen at once, without calling the API yet', async () => {
    const { store, service, backend } = await setup();
    const outcome = await service.act(find(store, 'req-1'), 'approve', { undoable: true });
    expect(outcome.request?.status).toBe('approved');
    expect(find(store, 'req-1').status).toBe('approved');
    const server = backend.database.get('req-1', { name: 'Carla Mendes', role: 'approver' });
    expect(server.ok && server.value.status).toBe('in_review');
  });

  it('restores the previous state and never calls the API when the user undoes', async () => {
    const { store, service, backend, toast } = await setup();
    await service.act(find(store, 'req-1'), 'approve', { undoable: true });
    toast.toasts()[0].action?.run();
    expect(find(store, 'req-1').status).toBe('in_review');
    await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS + LATENCY);
    const server = backend.database.get('req-1', { name: 'Carla Mendes', role: 'approver' });
    expect(server.ok && server.value.status).toBe('in_review');
  });

  it('confirms the decision on the server after the undo window', async () => {
    const { store, service, backend } = await setup();
    await service.act(find(store, 'req-1'), 'approve', { undoable: true });
    await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS + LATENCY);
    const server = backend.database.get('req-1', { name: 'Carla Mendes', role: 'approver' });
    expect(server.ok && server.value.status).toBe('approved');
    expect(find(store, 'req-1').status).toBe('approved');
  });

  it('flushes a pending decision before acting again on the same request', async () => {
    const { store, service, backend } = await setup();
    await service.act(find(store, 'req-1'), 'approve', { undoable: true });
    const second = service.act(find(store, 'req-1'), 'complete', { quiet: true });
    await vi.advanceTimersByTimeAsync(LATENCY * 3);
    expect((await second).error).toBeNull();
    const server = backend.database.get('req-1', { name: 'Carla Mendes', role: 'approver' });
    expect(server.ok && server.value.status).toBe('completed');
  });

  it('reports a conflict, refreshes the cache and explains what happened', async () => {
    const { store, service, backend, toast } = await setup();
    const stale = find(store, 'req-1');
    backend.database.transition(
      'req-1',
      { action: 'return', expectedStatus: 'in_review', comment: 'Ajuste' },
      BRUNO,
      new Date(),
    );
    const pending = service.act(stale, 'approve');
    await vi.advanceTimersByTimeAsync(LATENCY);
    expect((await pending).error).toBe('conflict');
    await vi.advanceTimersByTimeAsync(LATENCY);
    expect(find(store, 'req-1').status).toBe('returned');
    expect(toast.toasts().some((item) => item.message.includes('mudou'))).toBe(true);
  });

  it('does not open a dialog in batch mode when a justification is required', async () => {
    const { store, service } = await setup();
    const overdue = store.requests().find((item) => item.id === 'req-3');
    if (!overdue) throw new Error('req-3 missing');
    const outcome = await service.act(overdue, 'approve', { prompt: false, quiet: true });
    expect(outcome.error).toBe('justification_required');
    expect(TestBed.inject(CommentPromptService).open()).toBeNull();
  });

  it('returns cancelled when the user closes the comment dialog', async () => {
    const { store, service } = await setup();
    const pending = service.act(find(store, 'req-1'), 'reject');
    await vi.advanceTimersByTimeAsync(50);
    expect(TestBed.inject(CommentPromptService).open()).not.toBeNull();
    TestBed.inject(CommentPromptService).answer(undefined);
    expect(await pending).toEqual({ request: null, error: null, cancelled: true });
  });

  it('blocks forbidden actions before any call', async () => {
    const { store, service } = await setup();
    expect(service.blocker(find(store, 'req-1'), 'submit')).toBe('invalid_transition');
    expect(service.blocker(find(store, 'req-9'), 'approve')).toBe('invalid_transition');
  });
});
