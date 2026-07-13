import {
  parseBrDate,
  formatBrDate,
  calculateAge,
  daysBetween,
  rangesOverlap,
} from '../../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('parseBrDate', () => {
    it('converte uma data válida no formato dd/MM/yyyy', () => {
      const date = parseBrDate('20/04/2023');
      expect(date).not.toBeNull();
      expect(date?.getUTCFullYear()).toBe(2023);
      expect(date?.getUTCMonth()).toBe(3); // abril = índice 3
      expect(date?.getUTCDate()).toBe(20);
    });

    it('retorna null para formato incorreto', () => {
      expect(parseBrDate('2023-04-20')).toBeNull();
      expect(parseBrDate('20-04-2023')).toBeNull();
      expect(parseBrDate('abc')).toBeNull();
    });

    it('retorna null para uma data de calendário inexistente', () => {
      expect(parseBrDate('31/02/2023')).toBeNull();
      expect(parseBrDate('32/01/2023')).toBeNull();
    });
  });

  describe('formatBrDate', () => {
    it('formata uma data para dd/MM/yyyy', () => {
      const date = new Date(Date.UTC(2023, 3, 20));
      expect(formatBrDate(date)).toBe('20/04/2023');
    });

    it('preenche dia e mês com zero à esquerda quando necessário', () => {
      const date = new Date(Date.UTC(2000, 2, 3));
      expect(formatBrDate(date)).toBe('03/03/2000');
    });
  });

  describe('calculateAge', () => {
    it('calcula corretamente quando o aniversário já passou no ano de referência', () => {
      const birth = new Date(Date.UTC(2000, 2, 3));
      const reference = new Date(Date.UTC(2026, 6, 13));
      expect(calculateAge(birth, reference)).toBe(26);
    });

    it('calcula corretamente quando o aniversário ainda não chegou no ano de referência', () => {
      const birth = new Date(Date.UTC(2000, 11, 25));
      const reference = new Date(Date.UTC(2026, 6, 13));
      expect(calculateAge(birth, reference)).toBe(25);
    });

    it('calcula corretamente no dia exato do aniversário', () => {
      const birth = new Date(Date.UTC(2008, 6, 13));
      const reference = new Date(Date.UTC(2026, 6, 13));
      expect(calculateAge(birth, reference)).toBe(18);
    });
  });

  describe('daysBetween', () => {
    it('calcula os dias entre duas datas (exemplo do desafio: 500,00 / 50 por dia = 10 dias)', () => {
      const start = new Date(Date.UTC(2023, 3, 20));
      const end = new Date(Date.UTC(2023, 3, 30));
      expect(daysBetween(start, end)).toBe(10);
    });

    it('retorna 0 quando início e fim são o mesmo dia', () => {
      const date = new Date(Date.UTC(2023, 3, 20));
      expect(daysBetween(date, date)).toBe(0);
    });
  });

  describe('rangesOverlap', () => {
    it('detecta sobreposição quando os períodos se cruzam parcialmente', () => {
      const startA = new Date(Date.UTC(2023, 3, 20));
      const endA = new Date(Date.UTC(2023, 3, 30));
      const startB = new Date(Date.UTC(2023, 3, 25));
      const endB = new Date(Date.UTC(2023, 4, 5));
      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('detecta que períodos não sobrepostos não colidem', () => {
      const startA = new Date(Date.UTC(2023, 3, 1));
      const endA = new Date(Date.UTC(2023, 3, 10));
      const startB = new Date(Date.UTC(2023, 3, 11));
      const endB = new Date(Date.UTC(2023, 3, 20));
      expect(rangesOverlap(startA, endA, startB, endB)).toBe(false);
    });

    it('considera os limites (inclusive) como sobreposição', () => {
      const startA = new Date(Date.UTC(2023, 3, 1));
      const endA = new Date(Date.UTC(2023, 3, 10));
      const startB = new Date(Date.UTC(2023, 3, 10));
      const endB = new Date(Date.UTC(2023, 3, 20));
      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });
  });
});
