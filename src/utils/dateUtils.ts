const BR_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Converte uma data no formato brasileiro "dd/MM/yyyy" (usado em todo o
 * desafio) para um objeto Date em UTC. Retorna null se o formato ou o
 * valor da data forem inválidos (ex: 31/02/2023).
 */
export function parseBrDate(value: string): Date | null {
  const match = BR_DATE_REGEX.exec(value);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  const isRealCalendarDate =
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day);

  return isRealCalendarDate ? date : null;
}

/** Formata uma data para o padrão brasileiro "dd/MM/yyyy". */
export function formatBrDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/** Calcula a idade (em anos completos) em uma data de referência (padrão: hoje). */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - birthDate.getUTCMonth();

  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < birthDate.getUTCDate())) {
    age -= 1;
  }

  return age;
}

/** Número de dias (inteiro) entre duas datas. */
export function daysBetween(start: Date, end: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utcStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const utcEnd = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.round((utcEnd - utcStart) / MS_PER_DAY);
}

/** Verifica se dois intervalos de datas [startA, endA] e [startB, endB] se sobrepõem (inclusive). */
export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA <= endB && startB <= endA;
}
