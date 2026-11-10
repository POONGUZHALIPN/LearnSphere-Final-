function validateRegistration(req, res, next) {
  const { name, email, password, department } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof department !== "string"
  ) {
    return res.status(400).json({
      message: "Name, email, password, and department are required"
    });
  }

  if (
    !name.trim() ||
    !department.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      message: "Enter a valid name, email, and department"
    });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      message: "Password must be between 8 and 72 characters"
    });
  }

  return next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password ||
    password.length > 72
  ) {
    return res.status(400).json({
      message: "A valid email and password are required"
    });
  }

  return next();
}

module.exports = { validateRegistration, validateLogin };
