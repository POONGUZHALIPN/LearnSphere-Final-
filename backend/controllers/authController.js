const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

async function register(req, res, next) {
  try {
    const student = await authService.registerStudent(req.body);
    return res.status(201).json({ message: "Student registered successfully", student });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const student = await authService.loginStudent(req.body);
    if (!process.env.JWT_SECRET) {
      const error = new Error("JWT_SECRET is not configured");
      error.statusCode = 500;
      throw error;
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
    const token = jwt.sign(
      { email: student.email, role: student.role },
      process.env.JWT_SECRET,
      { subject: String(student.id), expiresIn }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      tokenType: "Bearer",
      expiresIn,
      student
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login };
