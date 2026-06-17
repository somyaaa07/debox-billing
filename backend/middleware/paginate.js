export const paginate = (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page || 1));

    const limit = Math.min(100,
        Math.max(1,
            parseInt(req.query.limit || 10)
        )
    );

    const offset = (page - 1) * limit;

    const search = req.query.search || '';

    const sortBy = req.query.sortBy || 'createdAt';

    const sortOrder =
        (req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    req.pagination = {
        page,
        limit,
        offset,
        search,
        sortBy,
        sortOrder,
    };

    next();
};

export const paginateResponse = (rows, count, pagination) => {
  const { page, limit } = pagination;
  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
};