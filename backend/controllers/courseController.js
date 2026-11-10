const courseService = require("../services/courseService");

async function getCourses(req, res, next) {
  try {
    const pageValue = req.query.page === undefined ? 1 : Number(req.query.page);
    const limitValue = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isInteger(pageValue) || pageValue < 1 ||
        !Number.isInteger(limitValue) || limitValue < 1) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive whole numbers"
      });
    }
    const page = pageValue;
    const limit = Math.min(limitValue, 100);
    const courses = await courseService.getAllCourses({ page, limit });
    return res.status(200).json({
      success: true,
      count: courses.length,
      page,
      limit,
      data: courses
    });
  } catch (error) {
    return next(error);
  }
}

async function getCourse(req, res, next) {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    return next(error);
  }
}

async function addCourse(req, res, next) {
  try {
    const newCourse = await courseService.createCourse(req.body);
    return res.status(201).json({ success: true, message: "Course created successfully", data: newCourse });
  } catch (error) {
    return next(error);
  }
}

async function editCourse(req, res, next) {
  try {
    const updatedCourse = await courseService.updateCourse(req.params.id, req.body);
    if (!updatedCourse) return res.status(404).json({ success: false, message: "Course not found" });
    return res.status(200).json({ success: true, message: "Course updated successfully", data: updatedCourse });
  } catch (error) {
    return next(error);
  }
}

async function removeCourse(req, res, next) {
  try {
    const deleted = await courseService.deleteCourse(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Course not found" });
    return res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getCourses, getCourse, addCourse, editCourse, removeCourse };
