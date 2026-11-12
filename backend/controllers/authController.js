const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

function issueToken(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.statusCode = 500;
    throw error;
  }
  const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { subject: String(user.id), expiresIn }
  );
  return { token, tokenType: "Bearer", expiresIn };
}

async function register(req, res, next) {
  try {
    const student = await authService.registerStudent(req.body);
    return res.status(201).json({ message: "Student registered successfully", student });
  } catch (error) {
    return next(error);
  }
}

async function registerAdmin(req, res, next) {
  try {
    const admin = await authService.registerAdmin(req.body);
    return res.status(201).json({ message: "Admin registered successfully", admin });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const student = await authService.loginStudent(req.body);
    return res.status(200).json({
      message: "Login successful",
      ...issueToken(student),
      student
    });
  } catch (error) {
    return next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const admin = await authService.loginAdmin(req.body);
    return res.status(200).json({
      message: "Admin login successful",
      ...issueToken(admin),
      admin
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, registerAdmin, login, adminLogin };
