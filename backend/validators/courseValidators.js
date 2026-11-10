const { body } = require("express-validator");

const requiredText = (field, label, max) =>
  body(field)
    .isString().withMessage(`${label} must be text`)
    .trim()
    .notEmpty().withMessage(`${label} is required`)
    .isLength({ max }).withMessage(`${label} cannot exceed ${max} characters`);

const optionalText = (field, label, max) =>
  body(field)
    .optional()
    .isString().withMessage(`${label} must be text`)
    .trim()
    .notEmpty().withMessage(`${label} cannot be empty`)
    .isLength({ max }).withMessage(`${label} cannot exceed ${max} characters`);

const durationRule = body("duration")
  .optional()
  .custom((value) => {
    if (typeof value === "number") return Number.isFinite(value) && value > 0;
    return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 50;
  })
  .withMessage("Duration must be a positive number or a short duration label");

const createCourseValidation = [
  requiredText("courseName", "Course name", 150),
  requiredText("courseCode", "Course code", 30),
  requiredText("instructor", "Instructor", 100),
  durationRule,
  requiredText("category", "Category", 100),
  optionalText("description", "Description", 2000),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive"),
  body().custom((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    if (value.duration === undefined) throw new Error("Duration is required");
    return true;
  })
];

const updateCourseValidation = [
  body().custom((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const allowed = ["courseName", "title", "courseCode", "instructor", "duration", "durationLabel", "category", "description", "status"];
    if (!allowed.some((key) => value[key] !== undefined)) throw new Error("At least one course field is required");
    return true;
  }),
  optionalText("courseName", "Course name", 150),
  optionalText("title", "Course title", 150),
  optionalText("courseCode", "Course code", 30),
  optionalText("instructor", "Instructor", 100),
  durationRule,
  optionalText("durationLabel", "Duration", 50),
  optionalText("category", "Category", 100),
  optionalText("description", "Description", 2000),
  body("status").optional().isIn(["Active", "Inactive"]).withMessage("Status must be Active or Inactive")
];

module.exports = { createCourseValidation, updateCourseValidation };
