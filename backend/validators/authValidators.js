const { body } = require("express-validator");

const registerValidation = [
  body("name").isString().withMessage("Name must be text").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name cannot exceed 100 characters"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail().isLength({ max: 254 }).withMessage("Email is too long"),
  body("password").isString().withMessage("Password must be text").isLength({ min: 12, max: 72 }).withMessage("Password must contain 12 to 72 characters"),
  body("department").optional().isString().trim().isLength({ max: 100 }),
  body("degree").optional().isString().trim().isLength({ max: 100 }),
  body("year").optional().isString().trim().isLength({ max: 30 }),
  body("course").optional().isString().trim().isLength({ max: 150 })
];

const adminRegisterValidation = [
  body("name").isString().trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }),
  body("email").isEmail().normalizeEmail().withMessage("A valid email is required"),
  body("password").isString().isLength({ min: 12, max: 72 }).withMessage("Password must contain 12 to 72 characters"),
  body("inviteCode").isString().trim().notEmpty().withMessage("Admin invite code is required")
];

const loginValidation = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().withMessage("Password must be text").notEmpty().withMessage("Password is required").isLength({ max: 72 }).withMessage("Password is too long")
];

module.exports = { registerValidation, adminRegisterValidation, loginValidation };
