import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { RequestsStore } from '../../core/requests/requests.store';
import { SessionStore } from '../../core/session/session.store';
import { NowService } from '../../core/time/now.service';
import { computeAnalytics } from '../../domain/analytics';
import { formatHours } from '../../domain/sla';
import { Icon } from '../../shared/icon';
import { Counter } from '../../shared/counter';
import { BarChart, BarSeries } from '../../shared/charts/bar-chart';
import { ChartFrame } from '../../shared/charts/chart-frame';
import { DonutChart, DonutSegment } from '../../shared/charts/donut-chart';
import { HBarChart, HBarItem } from '../../shared/charts/hbar-chart';

const SKELETONS = [0, 1, 2, 3] as const;

@Component({
  selector: 'app-analytics',
  imports: [TranslatePipe, Icon, Counter, ChartFrame, BarChart, DonutChart, HBarChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics {
  private readonly store = inject(RequestsStore);
  private readonly i18n = inject(TranslationService);
  private readonly clock = inject(NowService);
  private readonly session = inject(SessionStore);

  /** Os gráficos nascem da trilha de auditoria: sem `audit.view` o servidor não a entrega. */
  protected readonly locked = computed(() => !this.session.can('audit.view'));

  protected readonly status = this.store.status;
  protected readonly skeletons = SKELETONS;

  protected readonly data = computed(() => computeAnalytics(this.store.requests(), this.clock.now()));

  protected readonly compliance = computed(() => {
    const rate = this.data().sla.complianceRate;
    return rate === null ? null : Math.round(rate * 100);
  });

  protected readonly weekLabels = computed(() => {
    this.i18n.locale();
    const formatter = new Intl.DateTimeFormat(this.i18n.locale(), {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    });
    return this.data().throughput.map((point) => formatter.format(new Date(point.weekStart)));
  });

  protected readonly throughputSeries = computed<BarSeries[]>(() => {
    this.i18n.locale();
    const points = this.data().throughput;
    return [
      {
        label: this.i18n.translateDynamic('analytics.created'),
        color: 'var(--ox-color-accent)',
        values: points.map((point) => point.created),
      },
      {
        label: this.i18n.translateDynamic('analytics.decided'),
        color: 'var(--ox-color-cyan)',
        values: points.map((point) => point.decided),
      },
    ];
  });

  protected readonly slaSegments = computed<DonutSegment[]>(() => {
    this.i18n.locale();
    const { sla } = this.data();
    const t = (key: string) => this.i18n.translateDynamic(key);
    return [
      { label: t('analytics.sla.onTime'), value: sla.onTime, color: 'var(--ox-color-success)' },
      { label: t('analytics.sla.late'), value: sla.late, color: 'var(--ox-color-danger)' },
      { label: t('analytics.sla.openBreached'), value: sla.openBreached, color: 'var(--ox-color-violet)' },
      { label: t('analytics.sla.openAtRisk'), value: sla.openAtRisk, color: 'var(--ox-color-warning)' },
    ];
  });

  protected readonly stages = computed<HBarItem[]>(() => {
    this.i18n.locale();
    const stages = this.data().bottleneck.filter((stage) => stage.samples > 0);
    const slowest = Math.max(0, ...stages.map((stage) => stage.averageHours));
    return stages.map((stage) => ({
      label: this.i18n.translateDynamic(`status.${stage.status}`),
      value: stage.averageHours,
      display: formatHours(stage.averageHours),
      highlight: stage.averageHours === slowest && slowest > 0,
    }));
  });

  protected readonly roles = computed<HBarItem[]>(() => {
    this.i18n.locale();
    return this.data().byRole.map((item) => ({
      label: this.i18n.translateDynamic(`role.${item.role}`),
      value: item.actions,
      display: String(item.actions),
    }));
  });

  protected readonly slowestStage = computed(() => this.stages().find((stage) => stage.highlight));

  protected retry(): void {
    this.store.load(true);
  }
}
