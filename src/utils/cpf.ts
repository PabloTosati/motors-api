/** Remove tudo que não for dígito. Ex: "131.147.860-49" -> "13114786049" */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Valida um CPF utilizando o algoritmo oficial de dígitos verificadores
 * (módulo 11), não apenas o formato. Aceita o CPF formatado ou não.
 */
export function isValidCpf(rawCpf: string): boolean {
  const cpf = normalizeCpf(rawCpf);

  if (cpf.length !== 11) return false;
  // Rejeita sequências de dígitos repetidos (ex: 111.111.111-11), que
  // passariam no cálculo do módulo 11 mas não são CPFs válidos.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string): number => {
    let sum = 0;
    let factor = base.length + 1;
    for (const char of base) {
      sum += Number(char) * factor;
      factor -= 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const base9 = cpf.slice(0, 9);
  const digit1 = calcDigit(base9);
  const digit2 = calcDigit(base9 + digit1);

  return cpf === `${base9}${digit1}${digit2}`;
}

/** Formata um CPF normalizado para o padrão 000.000.000-00 */
export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf);
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
