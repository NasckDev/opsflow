import { HttpErrorResponse, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FIXED_NOW } from '../../domain/testing/request-fixture';
import {
  ACTOR_NAME_HEADER,
  ACTOR_ROLE_HEADER,
  handleApiRequest,
  statusForError,
} from './mock-api.interceptor';
import { MockDatabase } from './mock-database';

function headers(name: string | null, role: string | null): HttpHeaders {
  let result = new HttpHeaders();
  if (name) result = result.set(ACTOR_NAME_HEADER, encodeURIComponent(name));
  if (role) result = result.set(ACTOR_ROLE_HEADER, role);
  return result;
}

const approver = headers('Carla Mendes', 'approver');
const requester = headers('Ana Souza', 'requester');

async function call(request: HttpRequest<unknown>, db = new MockDatabase(FIXED_NOW)) {
  try {
    const event = await firstValueFrom(handleApiRequest(request, db));
    return {
      status: (event as HttpResponse<unknown>).status,
      body: (event as HttpResponse<unknown>).body,
    };
  } catch (error) {
    const failure = error as HttpErrorResponse;
    return { status: failure.status, body: failure.error as unknown };
  }
}

describe('statusForError', () => {
  it.each([
    ['not_found', 404],
    ['conflict', 409],
    ['forbidden', 403],
    ['separation_of_duties', 403],
    ['not_owner', 403],
    ['invalid_input', 422],
    ['comment_required', 422],
  ])('%s → %i', (error, status) => {
    expect(statusForError(error)).toBe(status);
  });
});

describe('handleApiRequest', () => {
  it('answers 403 when the actor headers are missing or invalid', async () => {
    expect(
      (await call(new HttpRequest('GET', 'api/requests', { headers: headers(null, null) }))).status,
    ).toBe(403);
    expect(
      (await call(new HttpRequest('GET', 'api/requests', { headers: headers('Ana', 'superuser') })))
        .status,
    ).toBe(403);
  });

  it('lists requests for a valid actor, filtered by role', async () => {
    const all = await call(new HttpRequest('GET', 'api/requests', { headers: approver }));
    const own = await call(new HttpRequest('GET', 'api/requests', { headers: requester }));
    expect(all.status).toBe(200);
    expect((all.body as unknown[]).length).toBeGreaterThan((own.body as unknown[]).length);
  });

  it('answers 403 for a request the requester does not own', async () => {
    const result = await call(new HttpRequest('GET', 'api/requests/req-1', { headers: requester }));
    expect(result.status).toBe(403);
  });

  it('answers 404 for an unknown request and for an unknown route', async () => {
    expect(
      (await call(new HttpRequest('GET', 'api/requests/req-9999', { headers: approver }))).status,
    ).toBe(404);
    expect(
      (await call(new HttpRequest('DELETE', 'api/requests/req-1', { headers: approver }))).status,
    ).toBe(404);
  });

  it('answers 422 for a malformed create body', async () => {
    const result = await call(
      new HttpRequest(
        'POST',
        'api/requests',
        { submit: true, input: { title: 'x' } },
        { headers: requester },
      ),
    );
    expect(result).toMatchObject({ status: 422, body: { error: 'invalid_input' } });
  });

  it('answers 422 for a malformed transition body', async () => {
    const result = await call(
      new HttpRequest(
        'POST',
        'api/requests/req-1/transitions',
        { action: 'explode' },
        { headers: approver },
      ),
    );
    expect(result.status).toBe(422);
  });

  it('answers 409 when the expected status is stale', async () => {
    const result = await call(
      new HttpRequest(
        'POST',
        'api/requests/req-6/transitions',
        { action: 'approve', expectedStatus: 'in_review' },
        { headers: approver },
      ),
    );
    expect(result.status).toBe(409);
  });

  it('answers 403 when the role cannot perform the action', async () => {
    const result = await call(
      new HttpRequest(
        'POST',
        'api/requests/req-1/transitions',
        { action: 'approve', expectedStatus: 'in_review' },
        { headers: headers('Bruno Lima', 'reviewer') },
      ),
    );
    expect(result.status).toBe(403);
  });

  it('creates a request with 201 for a valid body', async () => {
    const body = {
      submit: false,
      input: {
        title: 'Licenças de design',
        description: '',
        category: 'purchase',
        priority: 'low',
        amount: 1200,
        dueAt: '2027-02-01T12:00:00.000Z',
        documents: ['orcamento.pdf'],
      },
    };
    const result = await call(
      new HttpRequest('POST', 'api/requests', body, { headers: requester }),
    );
    expect(result.status).toBe(201);
  });
});
