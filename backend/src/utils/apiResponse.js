const successResponse = (res, message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(200).json(response);
};

const createdResponse = (res, message, data = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(201).json(response);
};

const errorResponse = (res, statusCode, message, errors = []) => {
  const response = { success: false, message };
  if (errors.length > 0) response.errors = errors;
  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, message, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
};

module.exports = {
  successResponse,
  createdResponse,
  errorResponse,
  paginatedResponse
};
