import { isValidCpf, normalizeCpf, formatCpf } from '../../../src/utils/cpf';

describe('cpf utils', () => {
  describe('normalizeCpf', () => {
    it('remove pontuação e mantém apenas dígitos', () => {
      expect(normalizeCpf('131.147.860-49')).toBe('13114786049');
    });

    it('mantém uma string já normalizada', () => {
      expect(normalizeCpf('13114786049')).toBe('13114786049');
    });
  });

  describe('isValidCpf', () => {
    it('aceita um CPF válido formatado (exemplo do desafio)', () => {
      expect(isValidCpf('131.147.860-49')).toBe(true);
    });

    it('aceita um CPF válido sem formatação', () => {
      expect(isValidCpf('13114786049')).toBe(true);
    });

    it('rejeita CPF com dígitos verificadores incorretos', () => {
      expect(isValidCpf('123.456.789-00')).toBe(false);
    });

    it('rejeita sequências de dígitos repetidos', () => {
      expect(isValidCpf('111.111.111-11')).toBe(false);
      expect(isValidCpf('00000000000')).toBe(false);
    });

    it('rejeita CPF com quantidade errada de dígitos', () => {
      expect(isValidCpf('123456')).toBe(false);
      expect(isValidCpf('131147860491234')).toBe(false);
    });

    it('rejeita string vazia ou não numérica', () => {
      expect(isValidCpf('')).toBe(false);
      expect(isValidCpf('abc.def.ghi-jk')).toBe(false);
    });
  });

  describe('formatCpf', () => {
    it('formata um CPF normalizado para o padrão 000.000.000-00', () => {
      expect(formatCpf('13114786049')).toBe('131.147.860-49');
    });
  });
});
