import { TestBed } from '@angular/core/testing';
import { createAuditEntry } from '../domain/audit';
import { Actor } from '../domain/request.model';
import { buildRequest } from '../domain/testing/request-fixture';
import { Countdown } from './countdown';

const CARLA: Actor = { name: 'Carla Mendes', role: 'approver' };
const HOUR = 3_600_000;

function render(input: Parameters<typeof buildRequest>[0]) {
  localStorage.clear();
  const fixture = TestBed.createComponent(Countdown);
  fixture.componentRef.setInput('request', buildRequest(input));
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

const decision = (at: Date) =>
  createAuditEntry('c-1', {
    actor: CARLA,
    action: 'approve',
    from: 'in_review',
    to: 'approved',
    at,
  });

describe('Countdown component', () => {
  it('counts down for an open request', () => {
    const html = render({
      status: 'in_review',
      dueAt: new Date(Date.now() + 5 * HOUR + 600_000).toISOString(),
    });
    expect(html.textContent).toMatch(/5h \d{2}m/);
    expect(html.getAttribute('data-sla')).toBe('at_risk');
  });

  it('shows the overdue time for a breached request', () => {
    const html = render({
      status: 'in_review',
      dueAt: new Date(Date.now() - 3 * HOUR).toISOString(),
    });
    expect(html.textContent).toContain('atraso');
    expect(html.getAttribute('data-sla')).toBe('breached');
  });

  it('freezes the SLA after approval and says the decision was on time', () => {
    const due = new Date(Date.now() + 2 * HOUR);
    const html = render({
      status: 'approved',
      dueAt: due.toISOString(),
      audit: [decision(new Date(due.getTime() - 4 * HOUR))],
    });
    expect(html.getAttribute('data-sla')).toBe('closed');
    expect(html.textContent).toContain('Decidida no prazo');
  });

  it('says how late a late decision was', () => {
    const due = new Date(Date.now() - 10 * HOUR);
    const html = render({
      status: 'approved',
      dueAt: due.toISOString(),
      audit: [decision(new Date(due.getTime() + 5 * HOUR))],
    });
    expect(html.textContent).toContain('Decidida com 5h de atraso');
  });
});
