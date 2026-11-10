const mongoose = require("mongoose");

function validateObjectId(paramName = "id") {
  return (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
      return res.status(400).json({ success: false, message: `Invalid ${paramName}` });
    }
    return next();
  };
}

module.exports = validateObjectId;
