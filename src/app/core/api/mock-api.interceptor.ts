import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';
import { MockDatabase, RequestFilter } from './mock-database';
import { CreateRequestBody, TransitionBody } from './requests.api';
import { RequestStatus } from '../../domain/request.model';

export const API_PREFIX = 'api/requests';
const LATENCY_MS = 450;
const ITEM_PATTERN = /^api\/requests\/([\w-]+)$/;
const TRANSITION_PATTERN = /^api\/requests\/([\w-]+)\/transitions$/;

/** Estado do backend simulado (banco + chave de falhas), compartilhado pelo app. */
@Injectable({ providedIn: 'root' })
export class MockBackend {
  readonly database = new MockDatabase();
  readonly failuresEnabled = signal(false);
}

const respond = <T>(body: T, status = 200): Observable<HttpEvent<T>> =>
  of(new HttpResponse({ status, body }));

const reject = (status: number, error: string): Observable<never> =>
  throwError(() => new HttpErrorResponse({ status, error: { error } }));

function listRequests(request: HttpRequest<unknown>, db: MockDatabase) {
  const filter: RequestFilter = {
    query: request.params.get('q') ?? '',
    status: (request.params.get('status') ?? '') as RequestStatus | '',
  };
  return respond(db.list(filter));
}

function getRequest(id: string, db: MockDatabase) {
  const found = db.get(id);
  return found ? respond(found) : reject(404, 'not_found');
}

function createRequest(body: CreateRequestBody, db: MockDatabase) {
  const now = new Date();
  const created = db.create(body.input, body.actor, now);
  if (!body.submit) return respond(created, 201);
  const result = db.transition(
    created.id,
    { action: 'submit', actor: body.actor, expectedStatus: 'draft' },
    now,
  );
  return result.ok ? respond(result.value, 201) : reject(422, result.error);
}

function transitionRequest(id: string, body: TransitionBody, db: MockDatabase) {
  const result = db.transition(id, body, new Date());
  if (result.ok) return respond(result.value);
  const status = result.error === 'not_found' ? 404 : result.error === 'conflict' ? 409 : 422;
  return reject(status, result.error);
}

function route(request: HttpRequest<unknown>, db: MockDatabase): Observable<HttpEvent<unknown>> {
  const url = request.url;
  const transition = TRANSITION_PATTERN.exec(url);
  const item = ITEM_PATTERN.exec(url);
  if (request.method === 'GET' && url === API_PREFIX) return listRequests(request, db);
  if (request.method === 'POST' && url === API_PREFIX) {
    return createRequest(request.body as CreateRequestBody, db);
  }
  if (request.method === 'POST' && transition) {
    return transitionRequest(transition[1], request.body as TransitionBody, db);
  }
  if (request.method === 'GET' && item) return getRequest(item[1], db);
  return reject(404, 'not_found');
}

/**
 * Backend fake: atende `api/requests*` em memória, com latência e falhas
 * simuladas, para o app rodar 100% no navegador (inclusive no GitHub Pages).
 */
export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_PREFIX)) return next(request);
  const backend = inject(MockBackend);
  const response = backend.failuresEnabled()
    ? reject(503, 'network')
    : route(request, backend.database);
  // materialize/dematerialize aplica a latência também aos erros.
  return response.pipe(materialize(), delay(LATENCY_MS), dematerialize());
};
