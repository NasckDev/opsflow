import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';

/** Opção de gráfico aceita pelo `app-chart` (tipo do ECharts, reexportado para as telas). */
export type UiChartOption = EChartsCoreOption;
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { echartsEngine } from './echarts-setup';
import { UiTheme } from '../theme/ui-theme';
import { chartPalette } from './chart-palette';

/**
 * Gráfico Apache ECharts com o tema do app (cores, fonte e eixos vêm dos tokens, claro e
 * escuro). Quem usa passa só a `option` da série. Renderer SVG: nítido em qualquer DPR.
 */
@Component({
  selector: 'app-chart',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts: echartsEngine })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      echarts
      role="img"
      [attr.aria-label]="ariaLabel()"
      [options]="merged()"
      [initOpts]="{ renderer: 'svg' }"
      [style.height.px]="height()"
      class="app-chart"
    ></div>
  `,
  styles: `
    :host {
      display: block;
    }
    .app-chart {
      width: 100%;
    }
  `,
})
export class AppChart {
  private readonly theme = inject(UiTheme);

  readonly option = input.required<EChartsCoreOption>();
  readonly height = input(260);
  /** Descrição curta para leitor de tela. A tabela equivalente fica ao lado, na tela. */
  readonly ariaLabel = input.required<string>();

  protected readonly merged = computed<EChartsCoreOption>(() => {
    this.theme.mode();
    const palette = chartPalette();
    const option = this.option() as Record<string, unknown>;
    const base = {
      tooltip: {
        backgroundColor: palette.surface,
        borderColor: palette.grid,
        textStyle: { color: palette.text, fontFamily: palette.fontFamily },
        extraCssText: 'box-shadow: 0 6px 18px rgb(0 0 0 / 0.18);',
      },
      legend: { textStyle: { color: palette.text, fontFamily: palette.fontFamily } },
    };
    return {
      color: [...palette.series],
      backgroundColor: 'transparent',
      textStyle: { fontFamily: palette.fontFamily, color: palette.muted },
      animationDuration: 600,
      ...option,
      // Tooltip e legenda: o estilo do tema vale, e a série só acrescenta o que é dela.
      tooltip: { ...base.tooltip, ...(option['tooltip'] as object | undefined) },
      legend: { ...base.legend, ...(option['legend'] as object | undefined) },
    };
  });
}
