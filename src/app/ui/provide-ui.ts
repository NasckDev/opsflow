import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NzConfig, provideNzConfig } from 'ng-zorro-antd/core/config';
import { provideNzDateFnsAdapter } from 'ng-zorro-antd/core/time';
import { en_US, pt_BR, provideNzI18n } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { UI_ICONS } from './icons';

const CONFIG: NzConfig = {
  message: { nzTop: 64, nzMaxStack: 3 },
};

/** Providers da camada de UI: ícones, idioma e configuração do NG-ZORRO (o ECharts é registrado no próprio `app-chart`, que vive no chunk das análises). */
export function provideUi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideNzIcons([...UI_ICONS]),
    provideNzI18n(pt_BR),
    // O NG-ZORRO 22 exige um adaptador de datas explícito (sem ele o seletor de data não abre).
    provideNzDateFnsAdapter(),
    provideNzConfig(CONFIG),
  ]);
}

export { en_US, pt_BR };
