const buildQuery = (tableName, config, queryParams) => {
  const {
    searchColumns = [],
    filterColumns = [],
    sortableColumns = [],
    defaultSort = 'created_at',
    defaultOrder = 'DESC'
  } = config;

  const {
    page = 1,
    limit = 10,
    search = '',
    sort_by = defaultSort,
    sort_order = defaultOrder,
    ...filters
  } = queryParams;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = [];
  let params = [];
  let paramIndex = 1;

  // Search across text columns
  if (search && searchColumns.length > 0) {
    const searchClauses = searchColumns.map(col => {
      const clause = `${col}::text ILIKE $${paramIndex}`;
      return clause;
    });
    params.push(`%${search}%`);
    whereClauses.push(`(${searchClauses.join(' OR ')})`);
    paramIndex++;
  }

  // Exact-match filters
  for (const [key, value] of Object.entries(filters)) {
    if (value && filterColumns.includes(key)) {
      whereClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Validate sort column
  const validSort = sortableColumns.includes(sort_by) ? sort_by : defaultSort;
  const validOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const countQuery = `SELECT COUNT(*) as total FROM ${tableName} ${whereStr}`;
  const dataQuery = `SELECT * FROM ${tableName} ${whereStr} ORDER BY ${validSort} ${validOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

  const dataParams = [...params, limitNum, offset];

  return {
    countQuery,
    countParams: params,
    dataQuery,
    dataParams,
    page: pageNum,
    limit: limitNum
  };
};

module.exports = { buildQuery };
