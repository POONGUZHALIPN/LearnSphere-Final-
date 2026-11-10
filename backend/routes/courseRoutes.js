const express = require("express");
const {
  getCourses,
  getCourse,
  addCourse,
  editCourse,
  removeCourse
} = require("../controllers/courseController");
const { authenticateToken } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/objectIdValidation");
const authorizeRoles = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createCourseValidation,
  updateCourseValidation
} = require("../validators/courseValidators");

const router = express.Router();

router.get("/", getCourses);
router.get("/:id", validateObjectId("id"), getCourse);
router.post(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  createCourseValidation,
  validateRequest,
  addCourse
);
router.put(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validateObjectId("id"),
  updateCourseValidation,
  validateRequest,
  editCourse
);
router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("admin"),
  validateObjectId("id"),
  updateCourseValidation,
  validateRequest,
  editCourse
);
router.delete("/:id", authenticateToken, authorizeRoles("admin"), validateObjectId("id"), removeCourse);

module.exports = router;
