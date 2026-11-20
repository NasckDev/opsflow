import { TestBed } from '@angular/core/testing';
import { buildApprovalChain } from '../domain/approval-chain';
import { Actor, WorkflowAction, WorkflowRequest } from '../domain/request.model';
import { FIXED_NOW, buildRequest } from '../domain/testing/request-fixture';
import { applyTransition } from '../domain/workflow-machine';
import { provideUi } from '../ui';
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
  TestBed.configureTestingModule({ providers: [provideUi()] });
  const fixture = TestBed.createComponent(ApprovalChain);
  fixture.componentRef.setInput('steps', buildApprovalChain(request));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('ApprovalChain component', () => {
  it('marks only one step as in progress and calls the review optional', () => {
    const html = render(inReview());
    expect(html.querySelectorAll('.ant-steps-item-process')).toHaveLength(1);
    const optional = Array.from(html.querySelectorAll('.ant-steps-item')).find((item) =>
      item.textContent?.includes('Opcional'),
    );
    expect(optional?.textContent).toContain('decidir sem esta etapa');
  });

  it('shows the four steps in order', () => {
    const labels = Array.from(render(inReview()).querySelectorAll('.ant-steps-item-title')).map((el) =>
      el.textContent?.trim(),
    );
    const names = ['Solicitação', 'Revisão', 'Aprovação', 'Conclusão'];
    expect(labels).toHaveLength(names.length);
    names.forEach((name, index) => expect(labels[index]?.startsWith(name)).toBe(true));
  });

  it('shows the approver and the done state after approval', () => {
    const approved = applyTransition(inReview(), 'approve' as WorkflowAction, {
      actor: CARLA,
      now: FIXED_NOW,
    });
    if (!approved.ok) throw new Error(approved.error);
    const html = render(approved.value);
    const approval = html.querySelectorAll('.ant-steps-item')[2];
    expect(approval.classList).toContain('ant-steps-item-finish');
    expect(approval.textContent).toContain('Carla Mendes');
    expect(html.querySelectorAll('.ant-steps-item-process')).toHaveLength(1);
  });
});
