import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { RequestsStore } from '../../core/requests/requests.store';
import { SessionStore } from '../../core/session/session.store';
import { NowService } from '../../core/time/now.service';
import { computeAnalytics } from '../../domain/analytics';
import { formatHours } from '../../domain/sla';
import { ChartCard } from '../../shared/chart-card';
import {
  AppAlert,
  AppButton,
  AppCard,
  AppChart,
  AppEmpty,
  AppPageHeader,
  AppResult,
  AppSkeleton,
  AppStatistic,
  ChartPalette,
  UiChartOption,
  UiTheme,
  chartPalette,
} from '../../ui';

interface StageRow {
  readonly label: string;
  readonly value: number;
  readonly display: string;
  readonly highlight: boolean;
}

@Component({
  selector: 'app-analytics',
  imports: [
    TranslatePipe,
    ChartCard,
    AppAlert,
    AppButton,
    AppCard,
    AppChart,
    AppEmpty,
    AppPageHeader,
    AppResult,
    AppSkeleton,
    AppStatistic,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss',
})
export class Analytics {
  private readonly store = inject(RequestsStore);
  private readonly i18n = inject(TranslationService);
  private readonly clock = inject(NowService);
  private readonly session = inject(SessionStore);
  private readonly theme = inject(UiTheme);

  /** Os gráficos nascem da trilha de auditoria: sem `audit.view` o servidor não a entrega. */
  protected readonly locked = computed(() => !this.session.can('audit.view'));
  protected readonly status = this.store.status;

  protected readonly data = computed(() =>
    computeAnalytics(this.store.requests(), this.clock.now()),
  );

  protected readonly compliance = computed(() => {
    const rate = this.data().sla.complianceRate;
    return rate === null ? null : Math.round(rate * 100);
  });

  protected readonly weekLabels = computed(() => {
    const formatter = new Intl.DateTimeFormat(this.i18n.locale(), {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    });
    return this.data().throughput.map((point) => formatter.format(new Date(point.weekStart)));
  });

  protected readonly slaRows = computed(() => {
    this.i18n.locale();
    const { sla } = this.data();
    const t = (key: string) => this.i18n.translateDynamic(key);
    return [
      { label: t('analytics.sla.onTime'), value: sla.onTime, tone: 'success' as const },
      { label: t('analytics.sla.late'), value: sla.late, tone: 'danger' as const },
      { label: t('analytics.sla.openBreached'), value: sla.openBreached, tone: 'violet' as const },
      { label: t('analytics.sla.openAtRisk'), value: sla.openAtRisk, tone: 'warning' as const },
    ];
  });

  protected readonly stages = computed<StageRow[]>(() => {
    this.i18n.locale();
    const stages = this.data().bottleneck.filter((stage) => stage.samples > 0);
    const slowest = Math.max(0, ...stages.map((stage) => stage.averageHours));
    return stages.map((stage) => ({
      label: this.i18n.translateDynamic(`status.${stage.status}`),
      value: Math.round(stage.averageHours * 10) / 10,
      display: formatHours(stage.averageHours),
      highlight: stage.averageHours === slowest && slowest > 0,
    }));
  });

  protected readonly roles = computed(() => {
    this.i18n.locale();
    return this.data().byRole.map((item) => ({
      label: this.i18n.translateDynamic(`role.${item.role}`),
      value: item.actions,
    }));
  });

  protected readonly slowestStage = computed(() => this.stages().find((stage) => stage.highlight));

  protected readonly throughputOption = computed<UiChartOption>(() => {
    const palette = this.palette();
    const points = this.data().throughput;
    return {
      grid: { left: 36, right: 12, top: 36, bottom: 28 },
      legend: { top: 0, right: 0 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: this.weekLabels(),
        axisLine: { lineStyle: { color: palette.grid } },
        axisLabel: { color: palette.muted },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: palette.grid, opacity: 0.6 } },
        axisLabel: { color: palette.muted },
      },
      series: [
        {
          name: this.i18n.translateDynamic('analytics.created'),
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { color: palette.accent, borderRadius: [3, 3, 0, 0] },
          data: points.map((point) => point.created),
        },
        {
          name: this.i18n.translateDynamic('analytics.decided'),
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { color: palette.cyan, borderRadius: [3, 3, 0, 0] },
          data: points.map((point) => point.decided),
        },
      ],
    };
  });

  protected readonly slaOption = computed<UiChartOption>(() => {
    const palette = this.palette();
    const colors = [palette.success, palette.danger, palette.violet, palette.warning];
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, itemWidth: 12, itemHeight: 12 },
      series: [
        {
          type: 'pie',
          radius: ['52%', '76%'],
          center: ['50%', '44%'],
          label: { show: false },
          itemStyle: { borderColor: palette.surface, borderWidth: 2 },
          data: this.slaRows().map((row, index) => ({
            name: row.label,
            value: row.value,
            itemStyle: { color: colors[index] },
          })),
        },
      ],
    };
  });

  protected readonly stagesOption = computed<UiChartOption>(() =>
    this.horizontalBars(
      this.stages().map((stage) => ({
        name: stage.label,
        value: stage.value,
        highlight: stage.highlight,
        display: stage.display,
      })),
    ),
  );

  protected readonly rolesOption = computed<UiChartOption>(() =>
    this.horizontalBars(
      this.roles().map((role) => ({
        name: role.label,
        value: role.value,
        highlight: false,
        display: String(role.value),
      })),
    ),
  );

  protected retry(): void {
    this.store.load(true);
  }

  private palette(): ChartPalette {
    this.theme.mode();
    return chartPalette();
  }

  private horizontalBars(
    items: readonly { name: string; value: number; highlight: boolean; display: string }[],
  ): UiChartOption {
    const palette = this.palette();
    return {
      grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        inverse: true,
        data: items.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: palette.text },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 18,
          label: {
            show: true,
            position: 'right',
            color: palette.text,
            formatter: (params: { dataIndex: number }) => items[params.dataIndex].display,
          },
          data: items.map((item) => ({
            value: item.value,
            itemStyle: {
              color: item.highlight ? palette.warning : palette.accent,
              borderRadius: [0, 3, 3, 0],
            },
          })),
        },
      ],
    };
  }
}
