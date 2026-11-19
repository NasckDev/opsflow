import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationParams, TranslationService } from './translation.service';

/**
 * Impuro de propósito: lê o signal de idioma, então a view é marcada para
 * atualização quando o usuário troca de idioma (funciona em modo zoneless).
 * Aceita string para permitir chaves compostas (`'status.' + status`).
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(TranslationService);

  transform(key: string, params?: TranslationParams): string {
    return this.i18n.translateDynamic(key, params);
  }
}
