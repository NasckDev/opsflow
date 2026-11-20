import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestComment } from '../../domain/comments';
import {
  NewRequestInput,
  RequestStatus,
  WorkflowAction,
  WorkflowRequest,
} from '../../domain/request.model';
import { SessionStore } from '../session/session.store';
import { ACTOR_NAME_HEADER, ACTOR_ROLE_HEADER } from './mock-api.interceptor';
import { RequestFilter } from './mock-database';

export interface CreateRequestBody {
  readonly input: NewRequestInput;
  readonly submit: boolean;
}

export interface CommentBody {
  readonly body: string;
}

export interface DocumentBody {
  readonly name: string;
}

export interface TransitionBody {
  readonly action: WorkflowAction;
  readonly comment?: string;
  readonly expectedStatus: RequestStatus;
  /** Versão que o usuário viu: se mudou no servidor (mesmo voltando ao mesmo status), é conflito. */
  readonly expectedUpdatedAt?: string;
}

/** Extrai o código de erro de domínio devolvido pela API (ou "network"). */
export function apiErrorCode(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body: unknown = error.error;
    if (typeof body === 'object' && body !== null && 'error' in body) {
      return String(body.error);
    }
  }
  return 'network';
}

@Injectable({ providedIn: 'root' })
export class RequestsApi {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionStore);

  /** Quem está chamando vai nos cabeçalhos: é o que o servidor usa para RBAC e filtragem. */
  private headers(): HttpHeaders {
    const actor = this.session.actor();
    return new HttpHeaders({
      [ACTOR_NAME_HEADER]: encodeURIComponent(actor.name),
      [ACTOR_ROLE_HEADER]: actor.role,
    });
  }

  list(filter: RequestFilter): Observable<WorkflowRequest[]> {
    const params = new HttpParams({
      fromObject: { q: filter.query ?? '', status: filter.status ?? '' },
    });
    return this.http.get<WorkflowRequest[]>('api/requests', { params, headers: this.headers() });
  }

  get(id: string): Observable<WorkflowRequest> {
    return this.http.get<WorkflowRequest>(`api/requests/${encodeURIComponent(id)}`, {
      headers: this.headers(),
    });
  }

  create(body: CreateRequestBody): Observable<WorkflowRequest> {
    return this.http.post<WorkflowRequest>('api/requests', body, { headers: this.headers() });
  }

  comments(id: string): Observable<RequestComment[]> {
    return this.http.get<RequestComment[]>(`api/requests/${encodeURIComponent(id)}/comments`, {
      headers: this.headers(),
    });
  }

  addComment(id: string, body: CommentBody): Observable<RequestComment> {
    return this.http.post<RequestComment>(`api/requests/${encodeURIComponent(id)}/comments`, body, {
      headers: this.headers(),
    });
  }

  addDocument(id: string, body: DocumentBody): Observable<WorkflowRequest> {
    return this.http.post<WorkflowRequest>(
      `api/requests/${encodeURIComponent(id)}/documents`,
      body,
      { headers: this.headers() },
    );
  }

  transition(id: string, body: TransitionBody): Observable<WorkflowRequest> {
    return this.http.post<WorkflowRequest>(
      `api/requests/${encodeURIComponent(id)}/transitions`,
      body,
      { headers: this.headers() },
    );
  }
}
