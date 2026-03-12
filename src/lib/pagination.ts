/**
 * Safe pagination parameter extraction with bounds enforcement.
 * Prevents DoS via unbounded limit/page values.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
) {
  const { page: defaultPage = 1, limit: defaultLimit = 20, maxLimit = 100 } = defaults;

  const page = Math.max(1, parseInt(searchParams.get("page") || String(defaultPage)) || defaultPage);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit)) || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
