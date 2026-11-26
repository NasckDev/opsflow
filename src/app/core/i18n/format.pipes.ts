import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

/** Data no idioma ativo (impuro pelo mesmo motivo do pipe `t`). */
@Pipe({ name: 'localDate', pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(iso: string): string {
    return this.i18n.formatDate(iso);
  }
}

@Pipe({ name: 'shortDate', pure: false })
export class ShortDatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(iso: string): string {
    return this.i18n.formatShortDate(iso);
  }
}

@Pipe({ name: 'money', pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(amount: number): string {
    return this.i18n.formatMoney(amount);
  }
}
