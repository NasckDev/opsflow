import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { DICTIONARIES, LOCALES, Locale, TranslationKey } from './translations';
import { readStorage, writeStorage } from '../storage';

export type TranslationParams = Readonly<Record<string, string | number>>;

const STORAGE_KEY = 'opsflow.locale';

const PLURAL_PATTERN = /\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/g;

/**
 * Substitui {nome} e formas plurais no estilo ICU simplificado:
 * "{count, plural, one {# tarefa} other {# tarefas}}" (o "#" vira o número).
 */
export function interpolate(
  template: string,
  params: TranslationParams = {},
): string {
  const withPlurals = template.replace(
    PLURAL_PATTERN,
    (match, name: string, one: string, other: string) => {
      if (!(name in params)) return match;
      const count = Number(params[name]);
      const form = count === 1 ? one : other;
      return form.replace(/#/g, String(count));
    },
  );
  return withPlurals.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

function isLocale(value: string | null): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<Locale>(this.initialLocale());

  readonly locale = this.current.asReadonly();

  constructor() {
    effect(() => {
      const locale = this.current();
      this.document.documentElement.lang = locale;
      writeStorage(STORAGE_KEY, locale);
    });
  }

  setLocale(locale: Locale): void {
    this.current.set(locale);
  }

  translate(key: TranslationKey, params?: TranslationParams): string {
    return interpolate(DICTIONARIES[this.current()][key], params);
  }

  /** Para chaves montadas em tempo de execução; chave desconhecida volta como está. */
  translateDynamic(key: string, params?: TranslationParams): string {
    const dictionary: Readonly<Record<string, string>> = DICTIONARIES[this.current()];
    const template = dictionary[key];
    return template === undefined ? key : interpolate(template, params);
  }

  /** Formata datas e valores no idioma ativo. */
  formatDate(iso: string): string {
    return new Intl.DateTimeFormat(this.current(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  }

  /** Data curta para trilhas densas (auditoria): "24/11 09:14". */
  formatShortDate(iso: string): string {
    const parts = new Intl.DateTimeFormat(this.current(), {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(iso));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value ?? '';
    const date = this.current() === 'en' ? `${part('month')}/${part('day')}` : `${part('day')}/${part('month')}`;
    return `${date} ${part('hour')}:${part('minute')}`;
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat(this.current(), { style: 'currency', currency: 'BRL' }).format(
      amount,
    );
  }

  private initialLocale(): Locale {
    const stored = readStorage(STORAGE_KEY);
    return isLocale(stored) ? stored : 'pt-BR';
  }
}
