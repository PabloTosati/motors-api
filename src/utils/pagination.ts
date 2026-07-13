export interface PaginationParams {
  limit: number;
  /** Página atual, indexada a partir de 1 (segue o contrato do desafio: offset/offsets = página/total de páginas). */
  offset: number;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/** Lê e sanitiza os parâmetros `limit`/`offset` vindos da query string. */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const rawLimit = Number(query.limit);
  const rawOffset = Number(query.offset);

  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 1;

  return { limit, offset };
}

/** Converte a página (1-indexada) em quantidade de registros a pular (SQL OFFSET). */
export function toSkip(pagination: PaginationParams): number {
  return (pagination.offset - 1) * pagination.limit;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  offsets: number;
}

/** Monta o envelope de paginação retornado nas rotas de listagem. */
export function buildPaginationMeta(total: number, pagination: PaginationParams): PaginationMeta {
  return {
    total,
    limit: pagination.limit,
    offset: pagination.offset,
    offsets: Math.max(1, Math.ceil(total / pagination.limit)),
  };
}
