const { body } = require("express-validator");

const registerValidation = [
  body("name").isString().withMessage("Name must be text").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail().isLength({ max: 254 }).withMessage("Email is too long"),
  body("password").isString().withMessage("Password must be text").isLength({ min: 12, max: 72 }).withMessage("Password must contain 12 to 72 characters"),
  body("department").isString().withMessage("Department must be text").trim().notEmpty().withMessage("Department is required").isLength({ max: 100 }).withMessage("Department cannot exceed 100 characters")
];

const loginValidation = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().withMessage("Password must be text").notEmpty().withMessage("Password is required").isLength({ max: 72 }).withMessage("Password is too long")
];

module.exports = { registerValidation, loginValidation };
