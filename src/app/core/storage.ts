/** Acesso defensivo ao localStorage (pode estar bloqueado ou indisponível). */
export function readStorage(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Preferências são opcionais: sem storage, o app segue com os padrões.
  }
}
