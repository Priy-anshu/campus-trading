/**
 * Standard response utility functions
 */

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: error ? error.message : null
  });
};

const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation Error',
    errors
  });
};

const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message
  });
};

const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

const sendNotFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
};
