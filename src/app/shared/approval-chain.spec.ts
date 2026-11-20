import { TestBed } from '@angular/core/testing';
import { buildApprovalChain } from '../domain/approval-chain';
import { Actor, WorkflowAction, WorkflowRequest } from '../domain/request.model';
import { FIXED_NOW, buildRequest } from '../domain/testing/request-fixture';
import { applyTransition } from '../domain/workflow-machine';
import { ApprovalChain } from './approval-chain';

const ANA: Actor = { name: 'Ana Souza', role: 'requester' };
const CARLA: Actor = { name: 'Carla Mendes', role: 'approver' };

function inReview(): WorkflowRequest {
  const result = applyTransition(buildRequest({ requester: ANA.name }), 'submit', {
    actor: ANA,
    now: FIXED_NOW,
  });
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

function render(request: WorkflowRequest) {
  localStorage.clear();
  const fixture = TestBed.createComponent(ApprovalChain);
  fixture.componentRef.setInput('steps', buildApprovalChain(request));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ApprovalChain component', () => {
  it('marks only one step as in progress and calls the review optional', () => {
    const html = render(inReview());
    expect(html.querySelectorAll('li[data-state="current"]')).toHaveLength(1);
    const optional = html.querySelector('li[data-state="optional"]');
    expect(optional?.textContent).toContain('Opcional');
    expect(optional?.textContent).toContain('decidir sem esta etapa');
  });

  it('shows the four steps in order', () => {
    const labels = Array.from(render(inReview()).querySelectorAll('li .name')).map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toEqual(['Solicitação', 'Revisão', 'Aprovação', 'Conclusão']);
  });

  it('shows the approver and the done state after approval', () => {
    const approved = applyTransition(inReview(), 'approve' as WorkflowAction, {
      actor: CARLA,
      now: FIXED_NOW,
    });
    if (!approved.ok) throw new Error(approved.error);
    const html = render(approved.value);
    const approval = html.querySelectorAll('li')[2];
    expect(approval.getAttribute('data-state')).toBe('done');
    expect(approval.textContent).toContain('Carla Mendes');
    expect(html.querySelectorAll('li[data-state="current"]')).toHaveLength(1);
  });
});
