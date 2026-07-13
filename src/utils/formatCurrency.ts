/** Formata um número para o padrão monetário brasileiro usado no desafio (ex: 500 -> "500,00"). */
export function formatCurrencyBr(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
