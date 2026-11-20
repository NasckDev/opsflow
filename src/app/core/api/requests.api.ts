import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Actor,
  NewRequestInput,
  RequestStatus,
  WorkflowAction,
  WorkflowRequest,
} from '../../domain/request.model';
import { RequestComment } from '../../domain/comments';
import { RequestFilter } from './mock-database';

export interface CreateRequestBody {
  readonly input: NewRequestInput;
  readonly actor: Actor;
  readonly submit: boolean;
}

export interface CommentBody {
  readonly actor: Actor;
  readonly body: string;
}

export interface DocumentBody {
  readonly name: string;
}

export interface TransitionBody {
  readonly action: WorkflowAction;
  readonly actor: Actor;
  readonly comment?: string;
  readonly expectedStatus: RequestStatus;
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

  list(filter: RequestFilter): Observable<WorkflowRequest[]> {
    const params = new HttpParams({
      fromObject: { q: filter.query ?? '', status: filter.status ?? '' },
    });
    return this.http.get<WorkflowRequest[]>('api/requests', { params });
  }

  get(id: string): Observable<WorkflowRequest> {
    return this.http.get<WorkflowRequest>(`api/requests/${encodeURIComponent(id)}`);
  }

  create(body: CreateRequestBody): Observable<WorkflowRequest> {
    return this.http.post<WorkflowRequest>('api/requests', body);
  }

  comments(id: string): Observable<RequestComment[]> {
    return this.http.get<RequestComment[]>(`api/requests/${encodeURIComponent(id)}/comments`);
  }

  addComment(id: string, body: CommentBody): Observable<RequestComment> {
    return this.http.post<RequestComment>(
      `api/requests/${encodeURIComponent(id)}/comments`,
      body,
    );
  }

  addDocument(id: string, body: DocumentBody): Observable<WorkflowRequest> {
    return this.http.post<WorkflowRequest>(
      `api/requests/${encodeURIComponent(id)}/documents`,
      body,
    );
  }

  transition(id: string, body: TransitionBody): Observable<WorkflowRequest> {
    return this.http.post<WorkflowRequest>(
      `api/requests/${encodeURIComponent(id)}/transitions`,
      body,
    );
  }
}
