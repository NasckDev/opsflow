import { BarChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

// Registro enxuto: só os gráficos e componentes que o app usa (nada de `import * from 'echarts'`).
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  SVGRenderer,
]);

// Uma constante (e não `export { echarts }`) mantém este módulo no bundle: um reexport puro seria
// ligado direto ao `echarts/core` e o registro acima não rodaria.
export const echartsEngine = echarts;
