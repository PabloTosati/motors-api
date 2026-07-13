const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verifica se uma string tem o formato de um UUID válido (v4 ou similar). */
export function isValidId(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id);
}
