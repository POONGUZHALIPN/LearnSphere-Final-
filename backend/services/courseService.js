const mongoose = require("mongoose");
const Course = require("../models/Course");
const starterCourses = require("../data/courses");

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  const match = String(value ?? "").match(/\d+(?:\.\d+)?/);
  const parsed = match ? Number(match[0]) : 1;
  return parsed > 0 ? parsed : 1;
}

function toCourseResponse(course) {
  if (!course) return null;
  const item = typeof course.toObject === "function" ? course.toObject() : course;
  const title = item.title || item.courseName || "Untitled course";
  return {
    id: String(item._id || item.id),
    courseName: title,
    courseCode: item.courseCode || "",
    instructor: item.instructor || "",
    duration: item.durationLabel || `${item.duration} Weeks`,
    category: item.category || "General",
    description: item.description || "Course description will be updated soon.",
    status: item.status || "Active"
  };
}

function toDatabaseCourse(data) {
  const title = String(data.courseName ?? data.title ?? "").trim();
  const durationLabel = String(data.duration ?? data.durationLabel ?? "1 Week").trim();
  return {
    title,
    description: String(data.description || "Course description will be updated soon.").trim(),
    duration: parseDuration(data.duration ?? data.durationLabel),
    durationLabel,
    courseCode: String(data.courseCode || "").trim(),
    instructor: String(data.instructor || "").trim(),
    category: String(data.category || "General").trim(),
    status: data.status === "Inactive" ? "Inactive" : "Active"
  };
}

async function seedInitialCourses() {
  const existingCount = await Course.countDocuments();
  if (existingCount > 0) return { seeded: false, count: existingCount };

  const documents = starterCourses.map((course) => toDatabaseCourse(course));
  await Course.insertMany(documents);
  console.log(`Inserted ${documents.length} starter courses into MongoDB.`);
  return { seeded: true, count: documents.length };
}

async function getAllCourses({ page = 1, limit = 20 } = {}) {
  const courses = await Course.find()
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return courses.map(toCourseResponse);
}

async function getCourseById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const course = await Course.findById(id).lean();
  return toCourseResponse(course);
}

async function createCourse(courseData) {
  const created = await Course.create(toDatabaseCourse(courseData));
  return toCourseResponse(created);
}

function toDatabaseCourseUpdate(data) {
  const update = {};
  if (data.courseName !== undefined || data.title !== undefined) {
    update.title = String(data.courseName ?? data.title).trim();
  }
  if (data.description !== undefined) update.description = String(data.description).trim();
  if (data.duration !== undefined || data.durationLabel !== undefined) {
    const label = String(data.duration ?? data.durationLabel).trim();
    update.durationLabel = label;
    update.duration = parseDuration(data.duration ?? data.durationLabel);
  }
  if (data.courseCode !== undefined) update.courseCode = String(data.courseCode).trim();
  if (data.instructor !== undefined) update.instructor = String(data.instructor).trim();
  if (data.category !== undefined) update.category = String(data.category).trim();
  if (data.status !== undefined) update.status = data.status === "Inactive" ? "Inactive" : "Active";
  return update;
}

async function updateCourse(id, courseData) {
  if (!mongoose.isValidObjectId(id)) return null;
  const updated = await Course.findByIdAndUpdate(
    id,
    { $set: toDatabaseCourseUpdate(courseData) },
    { new: true, runValidators: true }
  );
  return toCourseResponse(updated);
}

async function deleteCourse(id) {
  if (!mongoose.isValidObjectId(id)) return false;
  const deleted = await Course.findByIdAndDelete(id);
  return Boolean(deleted);
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  seedInitialCourses,
  toCourseResponse,
  toDatabaseCourseUpdate
};
