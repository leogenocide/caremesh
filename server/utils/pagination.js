/**
 * CareMesh Server-Side Pagination Utility
 * Extracts and clamps pagination parameters, executes count and paginated queries.
 */

export function parsePaginationParams(query, defaultLimit = 20, maxLimit = 100) {
  const isPaginated = query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, Math.min(maxLimit, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;

  return {
    isPaginated,
    page,
    limit,
    offset
  };
}

export function executePaginatedQuery(db, {
  countSql,
  countParams = [],
  dataSql,
  dataParams = [],
  page = 1,
  limit = 20,
  formatter = (item) => item
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  // 1. Get total count
  const countRow = db.prepare(countSql).get(...countParams);
  const total = countRow ? Object.values(countRow)[0] : 0;
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Query paginated slice
  const paginatedSql = `${dataSql} LIMIT ? OFFSET ?`;
  const rows = db.prepare(paginatedSql).all(...dataParams, limitNum, offset);
  const formattedData = rows.map(formatter);

  return {
    data: formattedData,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  };
}
