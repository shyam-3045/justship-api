const logger = require("../config/logger");

const globalErrorHandler = (err, req, res, next) => {
  logger.error(`Error Occured : ${err.message}`)

  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
};

module.exports = globalErrorHandler;