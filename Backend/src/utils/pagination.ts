/**
 * Reads `page` and `limit` from the query and returns a normalised object.
 * Negative or non-numeric values fall back to defaults. Caps `limit` at 100
 * to keep page sizes sane.
 */
export function parsePagination(
  query: Record<string, unknown>,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
) {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 20;
  const maxLimit = defaults.maxLimit ?? 100;

  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : defaultPage;
  let limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildMeta(total: number, page: number, limit: number) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
