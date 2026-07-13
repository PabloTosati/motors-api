import { parsePagination, toSkip, buildPaginationMeta } from '../../../src/utils/pagination';
import { formatCurrencyBr } from '../../../src/utils/formatCurrency';
import { isValidId } from '../../../src/utils/idValidation';

describe('pagination utils', () => {
  describe('parsePagination', () => {
    it('usa valores padrão quando nada é informado', () => {
      expect(parsePagination({})).toEqual({ limit: 10, offset: 1 });
    });

    it('respeita limit e offset informados', () => {
      expect(parsePagination({ limit: '5', offset: '3' })).toEqual({ limit: 5, offset: 3 });
    });

    it('ignora valores inválidos e usa o padrão', () => {
      expect(parsePagination({ limit: 'abc', offset: '-1' })).toEqual({ limit: 10, offset: 1 });
    });

    it('limita o limit ao máximo permitido', () => {
      expect(parsePagination({ limit: '9999' })).toEqual({ limit: 100, offset: 1 });
    });
  });

  describe('toSkip', () => {
    it('calcula o skip (offset) a partir da página', () => {
      expect(toSkip({ limit: 100, offset: 1 })).toBe(0);
      expect(toSkip({ limit: 100, offset: 2 })).toBe(100);
      expect(toSkip({ limit: 10, offset: 3 })).toBe(20);
    });
  });

  describe('buildPaginationMeta', () => {
    it('monta o envelope de paginação (exemplo do desafio: total 1000, limit 100 -> 10 páginas)', () => {
      expect(buildPaginationMeta(1000, { limit: 100, offset: 1 })).toEqual({
        total: 1000,
        limit: 100,
        offset: 1,
        offsets: 10,
      });
    });

    it('arredonda offsets para cima quando não é divisão exata', () => {
      expect(buildPaginationMeta(21, { limit: 10, offset: 1 }).offsets).toBe(3);
    });

    it('retorna ao menos 1 página mesmo sem resultados', () => {
      expect(buildPaginationMeta(0, { limit: 10, offset: 1 }).offsets).toBe(1);
    });
  });
});

describe('formatCurrencyBr', () => {
  it('formata um número inteiro no padrão brasileiro (exemplo do desafio)', () => {
    expect(formatCurrencyBr(500)).toBe('500,00');
  });

  it('formata um número com casas decimais', () => {
    expect(formatCurrencyBr(1234.5)).toBe('1234,50');
  });

  it('arredonda para duas casas decimais', () => {
    expect(formatCurrencyBr(10.005)).toBe('10,01');
  });
});

describe('isValidId', () => {
  it('aceita um UUID válido', () => {
    expect(isValidId('a0000000-0000-4000-8000-000000000001')).toBe(true);
  });

  it('rejeita strings que não são UUID', () => {
    expect(isValidId('id-invalido')).toBe(false);
    expect(isValidId('12345')).toBe(false);
    expect(isValidId('')).toBe(false);
  });
});
