const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: result.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg
      }))
    });
  }
  return next();
}

module.exports = validateRequest;
