/**
 * Helper functions for optimized database queries
 */

/**
 * Build pagination object
 */
const getPagination = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return { skip, limit, page };
};

/**
 * Build select fields for projection
 */
const getSelectFields = (modelName) => {
  const fieldMaps = {
    Product: '_id title price images productType category brand compareAtPrice',
    User: '_id name email role createdAt',
    Order: '_id orderId userId totalAmount status createdAt',
  };
  return fieldMaps[modelName] || '';
};

/**
 * Execute query with optimizations
 */
const optimizedFind = async (Model, query = {}, options = {}) => {
  const { limit = 20, skip = 0, fields = '', lean = true } = options;

  let dbQuery = Model.find(query);

  if (fields) {
    dbQuery = dbQuery.select(fields);
  }

  if (lean) {
    dbQuery = dbQuery.lean();
  }

  if (skip) {
    dbQuery = dbQuery.skip(skip);
  }

  dbQuery = dbQuery.limit(limit);

  return dbQuery.exec();
};

/**
 * Count documents efficiently
 */
const countDocuments = async (Model, query = {}) => {
  return Model.countDocuments(query);
};

/**
 * Paginated query with count
 */
const paginatedQuery = async (Model, query = {}, options = {}) => {
  const { limit = 20, page = 1, fields = '' } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    optimizedFind(Model, query, { limit, skip, fields, lean: true }),
    countDocuments(Model, query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = {
  getPagination,
  getSelectFields,
  optimizedFind,
  countDocuments,
  paginatedQuery,
};
