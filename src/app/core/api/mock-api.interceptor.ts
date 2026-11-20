import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';
import { Actor, RequestStatus } from '../../domain/request.model';
import { MockDatabase, RequestFilter } from './mock-database';
import {
  parseActor,
  parseCommentBody,
  parseCreateBody,
  parseDocumentBody,
  parseTransitionBody,
} from './validation';

export const API_PREFIX = 'api/requests';
export const ACTOR_NAME_HEADER = 'x-actor-name';
export const ACTOR_ROLE_HEADER = 'x-actor-role';
const LATENCY_MS = 450;
const ITEM_PATTERN = /^api\/requests\/([\w-]+)$/;
const TRANSITION_PATTERN = /^api\/requests\/([\w-]+)\/transitions$/;
const COMMENTS_PATTERN = /^api\/requests\/([\w-]+)\/comments$/;
const DOCUMENTS_PATTERN = /^api\/requests\/([\w-]+)\/documents$/;

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

/** Código de erro de domínio para status HTTP: 404, 409, 403 (permissão) ou 422 (regra/validação). */
export function statusForError(error: string): number {
  if (error === 'not_found') return 404;
  if (error === 'conflict') return 409;
  if (error === 'forbidden' || error === 'separation_of_duties' || error === 'not_owner')
    return 403;
  return 422;
}

const failure = (error: string) => reject(statusForError(error), error);

function listRequests(request: HttpRequest<unknown>, db: MockDatabase, actor: Actor) {
  const filter: RequestFilter = {
    query: request.params.get('q') ?? '',
    status: (request.params.get('status') ?? '') as RequestStatus | '',
  };
  return respond(db.list(filter, actor));
}

function createRequest(body: unknown, db: MockDatabase, actor: Actor) {
  const command = parseCreateBody(body);
  if (!command.ok) return failure(command.error);
  const result = db.create(command.value.input, actor, new Date(), command.value.submit);
  return result.ok ? respond(result.value, 201) : failure(result.error);
}

function transitionRequest(id: string, body: unknown, db: MockDatabase, actor: Actor) {
  const command = parseTransitionBody(body);
  if (!command.ok) return failure(command.error);
  const result = db.transition(id, command.value, actor, new Date());
  return result.ok ? respond(result.value) : failure(result.error);
}

function postComment(id: string, body: unknown, db: MockDatabase, actor: Actor) {
  const parsed = parseCommentBody(body);
  if (!parsed.ok) return failure(parsed.error);
  const result = db.addComment(id, actor, parsed.value, new Date());
  return result.ok ? respond(result.value, 201) : failure(result.error);
}

function postDocument(id: string, body: unknown, db: MockDatabase, actor: Actor) {
  const parsed = parseDocumentBody(body);
  if (!parsed.ok) return failure(parsed.error);
  const result = db.addDocument(id, actor, parsed.value);
  return result.ok ? respond(result.value, 201) : failure(result.error);
}

/** Roteia uma chamada `api/requests*` para o banco simulado, aplicando RBAC e validação. */
export function handleApiRequest(
  request: HttpRequest<unknown>,
  db: MockDatabase,
): Observable<HttpEvent<unknown>> {
  const actor = parseActor(
    request.headers.get(ACTOR_NAME_HEADER),
    request.headers.get(ACTOR_ROLE_HEADER),
  );
  if (!actor) return failure('forbidden');
  const url = request.url;
  const method = request.method;
  if (method === 'GET' && url === API_PREFIX) return listRequests(request, db, actor);
  if (method === 'POST' && url === API_PREFIX) return createRequest(request.body, db, actor);
  const transition = TRANSITION_PATTERN.exec(url);
  if (method === 'POST' && transition) {
    return transitionRequest(transition[1], request.body, db, actor);
  }
  const comments = COMMENTS_PATTERN.exec(url);
  if (method === 'GET' && comments) {
    const result = db.listComments(comments[1], actor);
    return result.ok ? respond(result.value) : failure(result.error);
  }
  if (method === 'POST' && comments) return postComment(comments[1], request.body, db, actor);
  const documents = DOCUMENTS_PATTERN.exec(url);
  if (method === 'POST' && documents) return postDocument(documents[1], request.body, db, actor);
  const item = ITEM_PATTERN.exec(url);
  if (method === 'GET' && item) {
    const result = db.get(item[1], actor);
    return result.ok ? respond(result.value) : failure(result.error);
  }
  return failure('not_found');
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
    : handleApiRequest(request, backend.database);
  // materialize/dematerialize aplica a latência também aos erros.
  return response.pipe(materialize(), delay(LATENCY_MS), dematerialize());
};
