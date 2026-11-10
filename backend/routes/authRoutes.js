const express = require("express");
const authController = require("../controllers/authController");
const { registerValidation, loginValidation } = require("../validators/authValidators");
const validateRequest = require("../middleware/validateRequest");
const loginLimiter = require("../middleware/loginLimiter");

const router = express.Router();

router.post("/register", registerValidation, validateRequest, authController.register);
router.post("/login", loginLimiter, loginValidation, validateRequest, authController.login);

module.exports = router;
