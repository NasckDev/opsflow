import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { mockApiInterceptor } from '../../core/api/mock-api.interceptor';
import { ToastService } from '../../core/ui/toast.service';
import { provideUi } from '../../ui';
import { Inbox } from './inbox';

const LATENCY = 600;

async function render() {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([mockApiInterceptor])),
      provideUi(),
    ],
  });
  const fixture = TestBed.createComponent(Inbox);
  fixture.detectChanges();
  await vi.advanceTimersByTimeAsync(LATENCY);
  fixture.detectChanges();
  await vi.advanceTimersByTimeAsync(LATENCY);
  fixture.detectChanges();
  return fixture;
}

const rows = (root: HTMLElement) => root.querySelectorAll<HTMLElement>('tr.task');

describe('Inbox component', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('opens as approver with the orientation line and the pending tasks', async () => {
    const root = (await render()).nativeElement as HTMLElement;
    expect(root.querySelector('.orient')?.textContent).toContain('Troque de papel');
    expect(rows(root).length).toBeGreaterThan(3);
    expect(root.textContent).toContain('aguardam a sua ação como Aprovador');
  });

  it('removes a task from the list as soon as it is approved, with an undo toast', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    const before = rows(root).length;
    const row = Array.from(rows(root)).find((item) =>
      item.textContent?.includes('Conferência QCon'),
    );
    // A linha mostra a tarefa no painel de detalhe; a decisão fica no painel.
    row?.querySelector<HTMLButtonElement>('button.title')?.click();
    fixture.detectChanges();
    const detail = root.querySelector<HTMLElement>('[data-testid="inbox-detail"]');
    expect(detail?.textContent).toContain('Conferência QCon');
    const approve = Array.from(detail?.querySelectorAll('button') ?? []).find((button) =>
      button.textContent?.includes('Aprovar'),
    );
    approve?.click();
    await vi.advanceTimersByTimeAsync(50);
    fixture.detectChanges();
    expect(rows(root).length).toBe(before - 1);
    const toast = TestBed.inject(ToastService).toasts()[0];
    expect(toast.message).toContain('OPS-0004 aprovada');
    expect(toast.action?.label).toBe('Desfazer');
    toast.action?.run();
    fixture.detectChanges();
    expect(rows(root).length).toBe(before);
  });

  it('marks overdue tasks as needing a justification and keeps them out of the batch', async () => {
    const root = (await render()).nativeElement as HTMLElement;
    const overdue = root.querySelector<HTMLElement>('tr.task[data-sla="breached"]');
    expect(overdue?.textContent).toContain('aprove com justificativa');
    expect(overdue?.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('lists approved requests only under "Para concluir"', async () => {
    const fixture = await render();
    const root = fixture.nativeElement as HTMLElement;
    expect(
      Array.from(rows(root)).some((item) =>
        item.textContent?.includes('Contrato de suporte do ERP'),
      ),
    ).toBe(false);
    const chip = Array.from(root.querySelectorAll<HTMLButtonElement>('.filter button')).find((button) =>
      button.textContent?.includes('Para concluir'),
    );
    chip?.click();
    fixture.detectChanges();
    expect(
      Array.from(rows(root)).some((item) =>
        item.textContent?.includes('Contrato de suporte do ERP'),
      ),
    ).toBe(true);
  });
});
