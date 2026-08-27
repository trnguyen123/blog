function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};