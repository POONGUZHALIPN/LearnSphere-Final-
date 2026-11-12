const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const LearningProgress = require("../models/LearningProgress");
const authService = require("../services/authService");
const { authenticateToken } = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const courseContent = require("../../data/courseContent.json");

const router = express.Router();
const resetCodes = new Map();
const RESET_CODE_TTL = 15 * 60 * 1000;
const CIRCUMFERENCE = 2 * Math.PI * 36;

const studentOnly = [authenticateToken, authorizeRoles("student")];
const adminOnly = [authenticateToken, authorizeRoles("admin")];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findCourseByTitle(title) {
  return Course.findOne({
    title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
    status: "Active"
  });
}

async function getCourseProgress(studentId, courseId, totalModules) {
  let progress = await LearningProgress.findOne({ student: studentId, course: courseId });
  if (!progress) {
    progress = await LearningProgress.create({
      student: studentId,
      course: courseId,
      completedLessons: [],
      totalLessons: totalModules
    });
  }
  if (progress.totalLessons !== totalModules) {
    progress.totalLessons = totalModules;
    await progress.save();
  }
  const completedModules = progress.completedLessons || [];
  const modulePercent = totalModules ? (completedModules.length / totalModules) * 80 : 0;
  const progressPercentage = Math.min(100, Math.round(modulePercent + (progress.quizPassed ? 20 : 0)));
  const status = progress.quizPassed ? "Completed" : completedModules.length ? "Active" : "Not Started";
  return { progress, completedModules, progressPercentage, status };
}

async function buildStudentRecord(user) {
  const enrollments = await Enrollment.find({ student: user._id }).populate("course").sort({ enrolledAt: 1 }).lean();
  const courses = [];
  for (const enrollment of enrollments) {
    if (!enrollment.course) continue;
    const title = enrollment.course.title;
    const content = courseContent[title];
    const totalModules = content?.modules?.length || 0;
    const state = await getCourseProgress(user._id, enrollment.course._id, totalModules);
    courses.push({
      course: title,
      progress: state.progressPercentage,
      status: state.status,
      modulesDone: state.completedModules.length,
      modulesTotal: totalModules,
      completedModules: state.completedModules,
      quizPassed: state.progress.quizPassed,
      quizScore: state.progress.quizScore,
      quizAttempts: state.progress.quizAttempts,
      circumference: CIRCUMFERENCE,
      dashoffset: CIRCUMFERENCE * (1 - state.progressPercentage / 100)
    });
  }
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    degree: user.degree || user.department || "General",
    year: user.year || "1st Year",
    createdAt: user.createdAt,
    courses
  };
}

async function requireStudentCourse(req, res) {
  const courseName = decodeURIComponent(req.params.course);
  const course = await findCourseByTitle(courseName);
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return null;
  }
  const content = courseContent[course.title];
  if (!content) {
    res.status(404).json({ error: "Course learning content is not available yet." });
    return null;
  }
  const enrollment = await Enrollment.findOne({ student: req.user.id, course: course._id });
  if (!enrollment) {
    res.status(403).json({ error: "You must apply for this course before opening it." });
    return null;
  }
  return { course, content };
}

// Current-user/session compatibility API, now backed by the MongoDB JWT.
router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("name email role degree department year");
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    return res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      degree: user.degree || user.department || "General",
      year: user.year || "1st Year"
    });
  } catch (error) { return next(error); }
});

router.post("/logout", (req, res) => res.json({ message: "Logged out" }));

router.post("/change-password", authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword || String(newPassword).length < 12 || String(newPassword).length > 72) {
      return res.status(400).json({ error: "Current password and a new password of 12 to 72 characters are required." });
    }
    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ error: "Account not found." });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.json({ message: "Password updated successfully." });
  } catch (error) { return next(error); }
});

// Password reset is a demo-code flow (the UI displays the code); production
// email delivery can be connected later without changing the API contract.
router.post("/forgot-password", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required." });
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: "If that email exists in our system, a reset code has been generated." });
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(email, { code, expires: Date.now() + RESET_CODE_TTL });
    return res.json({ message: "Reset code generated.", demoCode: code });
  } catch (error) { return next(error); }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const code = String(req.body?.code || "").trim();
    const password = String(req.body?.password || "");
    if (!email || !code || password.length < 12 || password.length > 72) {
      return res.status(400).json({ error: "Email, code, and a new password of 12 to 72 characters are required." });
    }
    const entry = resetCodes.get(email);
    if (!entry || Date.now() > entry.expires || entry.code !== code) {
      resetCodes.delete(email);
      return res.status(400).json({ error: "This code is invalid or has expired. Please request a new one." });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Account not found." });
    user.password = await bcrypt.hash(password, 12);
    await user.save();
    resetCodes.delete(email);
    return res.json({ message: "Password reset successfully." });
  } catch (error) { return next(error); }
});

// Student dashboard and multi-course enrollment.
router.get("/student/dashboard", ...studentOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const student = await buildStudentRecord(user);
    const completed = student.courses.filter(item => item.progress >= 100);
    const inProgress = student.courses.filter(item => item.progress > 0 && item.progress < 100);
    return res.json({
      student: { id: student.id, name: student.name, email: student.email, degree: student.degree, year: student.year },
      courses: student.courses,
      stats: {
        enrolled: student.courses.length,
        completed: completed.length,
        inProgress: inProgress.length,
        certificates: completed.length
      },
      latestCertificate: completed.length ? completed[completed.length - 1] : null
    });
  } catch (error) { return next(error); }
});

router.get("/student/course-catalog", ...studentOnly, async (req, res, next) => {
  try {
    const courses = await Course.find({ status: "Active", title: { $in: Object.keys(courseContent) } }).sort({ createdAt: 1 }).lean();
    const enrollments = await Enrollment.find({ student: req.user.id }).select("course").lean();
    const enrolledIds = new Set(enrollments.map(item => String(item.course)));
    return res.json({
      courses: courses.map(course => ({
        name: course.title,
        enrolled: enrolledIds.has(String(course._id))
      }))
    });
  } catch (error) { return next(error); }
});

router.post("/student/courses/apply", ...studentOnly, async (req, res, next) => {
  try {
    const courseName = String(req.body?.course || req.body?.courseName || "").trim();
    if (!courseName) return res.status(400).json({ error: "Please select a course to apply." });
    const course = await findCourseByTitle(courseName);
    if (!course) return res.status(404).json({ error: "Course not found." });
    const existing = await Enrollment.findOne({ student: req.user.id, course: course._id });
    if (existing) return res.status(409).json({ error: "You are already enrolled in this course." });
    await Enrollment.create({ student: req.user.id, course: course._id });
    return res.status(201).json({ message: `Successfully applied for ${course.title}.` });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "You are already enrolled in this course." });
    return next(error);
  }
});

// The legacy UI expects an array of course-name strings at GET /api/courses.
router.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find({ status: "Active", title: { $in: Object.keys(courseContent) } }).sort({ createdAt: 1 }).select("title").lean();
    return res.json(courses.map(item => item.title));
  } catch (error) { return next(error); }
});

router.get("/courses/:course/content", ...studentOnly, async (req, res, next) => {
  try {
    const found = await requireStudentCourse(req, res);
    if (!found) return;
    const state = await getCourseProgress(req.user.id, found.course._id, found.content.modules.length);
    return res.json({
      course: found.course.title,
      modules: found.content.modules,
      quiz: found.content.quiz,
      completedModules: state.completedModules,
      quizPassed: state.progress.quizPassed,
      quizScore: state.progress.quizScore,
      quizAttempts: state.progress.quizAttempts,
      progress: state.progressPercentage,
      status: state.status
    });
  } catch (error) { return next(error); }
});

router.post("/student/courses/:course/modules/:moduleId/complete", ...studentOnly, async (req, res, next) => {
  try {
    const found = await requireStudentCourse(req, res);
    if (!found) return;
    const moduleExists = found.content.modules.some(item => item.id === req.params.moduleId);
    if (!moduleExists) return res.status(404).json({ error: "Course module not found." });
    const state = await getCourseProgress(req.user.id, found.course._id, found.content.modules.length);
    if (!state.completedModules.includes(req.params.moduleId)) {
      state.progress.completedLessons.push(req.params.moduleId);
      await state.progress.save();
    }
    const updated = await getCourseProgress(req.user.id, found.course._id, found.content.modules.length);
    return res.json({
      message: "Module marked complete.",
      completedModules: updated.completedModules,
      progress: updated.progressPercentage,
      status: updated.status
    });
  } catch (error) { return next(error); }
});

router.post("/student/courses/:course/quiz/submit", ...studentOnly, async (req, res, next) => {
  try {
    const found = await requireStudentCourse(req, res);
    if (!found) return;
    const questions = found.content.quiz?.questions || [];
    const answers = req.body?.answers;
    if (!Array.isArray(answers) || answers.length !== questions.length) {
      return res.status(400).json({ error: "Please answer every quiz question." });
    }
    const correctCount = questions.reduce((count, question, index) =>
      count + (Number(answers[index]) === Number(question.correct) ? 1 : 0), 0);
    const passed = questions.length > 0 && correctCount / questions.length >= (found.content.quiz.passRatio || 0.6);
    const state = await getCourseProgress(req.user.id, found.course._id, found.content.modules.length);
    state.progress.quizAttempts += 1;
    state.progress.quizScore = correctCount;
    state.progress.quizPassed = passed;
    await state.progress.save();
    const updated = await getCourseProgress(req.user.id, found.course._id, found.content.modules.length);
    return res.json({
      passed,
      correctCount,
      total: questions.length,
      progress: updated.progressPercentage,
      status: updated.status
    });
  } catch (error) { return next(error); }
});

// Admin dashboard overview and student CRUD.
router.get("/admin/overview", ...adminOnly, async (req, res, next) => {
  try {
    const students = await User.find({ role: "student" });
    const courses = await Course.find({ status: "Active", title: { $in: Object.keys(courseContent) } }).lean();
    const courseMap = new Map();
    let totalEnrollments = 0;
    let certificatesIssued = 0;
    const registrations = [];
    for (const user of students) {
      const record = await buildStudentRecord(user);
      for (const item of record.courses) {
        totalEnrollments += 1;
        if (item.progress >= 100) certificatesIssued += 1;
        if (!courseMap.has(item.course)) courseMap.set(item.course, { course: item.course, enrolled: 0, completed: 0, progressSum: 0 });
        const entry = courseMap.get(item.course);
        entry.enrolled += 1;
        entry.progressSum += item.progress;
        if (item.progress >= 100) entry.completed += 1;
        registrations.push({
          studentId: record.id,
          name: record.name,
          degree: record.degree,
          year: record.year,
          course: item.course,
          progress: item.progress,
          status: item.status
        });
      }
    }
    registrations.sort((a, b) => a.name.localeCompare(b.name));
    const courseStats = [...courseMap.values()].map(item => ({
      course: item.course,
      enrolled: item.enrolled,
      completed: item.completed,
      avgProgress: Math.round(item.progressSum / item.enrolled)
    }));
    return res.json({
      stats: {
        totalStudents: students.length,
        totalCourses: courses.length,
        totalEnrollments,
        certificatesIssued
      },
      courseStats,
      registrations
    });
  } catch (error) { return next(error); }
});

router.get("/students", ...adminOnly, async (req, res, next) => {
  try {
    const students = await User.find({ role: "student" }).sort({ createdAt: -1 });
    const records = [];
    for (const user of students) records.push(await buildStudentRecord(user));
    return res.json(records);
  } catch (error) { return next(error); }
});

router.get("/students/:id", ...adminOnly, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid student ID." });
    const user = await User.findOne({ _id: req.params.id, role: "student" });
    if (!user) return res.status(404).json({ error: "Student not found." });
    return res.json(await buildStudentRecord(user));
  } catch (error) { return next(error); }
});

router.post("/students", ...adminOnly, async (req, res, next) => {
  try {
    const { name, email, password, degree, year, course } = req.body || {};
    if (!name || !email || !password || !degree || !year || !course) {
      return res.status(400).json({ error: "All student fields are required." });
    }
    if (String(password).length < 6 || String(password).length > 72) {
      return res.status(400).json({ error: "Password must be between 6 and 72 characters." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ error: "A student with this email already exists." });
    const created = await authService.registerStudent({
      name, email: normalizedEmail, password,
      department: degree, degree, year, course
    });
    const user = await User.findById(created.id);
    return res.status(201).json({ message: "Student created successfully.", student: await buildStudentRecord(user) });
  } catch (error) { return next(error); }
});

async function updateStudent(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid student ID." });
    const user = await User.findOne({ _id: req.params.id, role: "student" }).select("+password");
    if (!user) return res.status(404).json({ error: "Student not found." });
    const body = req.body || {};
    const name = body.name ?? user.name;
    const email = String(body.email ?? user.email).trim().toLowerCase();
    const degree = body.degree ?? user.degree ?? user.department;
    const year = body.year ?? user.year;
    if (!name || !email || !degree || !year) return res.status(400).json({ error: "Name, email, degree and year are required." });
    const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
    if (duplicate) return res.status(409).json({ error: "A student with this email already exists." });
    user.name = String(name).trim();
    user.email = email;
    user.degree = String(degree).trim();
    user.department = String(degree).trim();
    user.year = String(year).trim();
    if (body.password) {
      if (String(body.password).length < 6 || String(body.password).length > 72) return res.status(400).json({ error: "Password must be between 6 and 72 characters." });
      user.password = await bcrypt.hash(String(body.password), 12);
    }
    await user.save();
    if (body.course) {
      const course = await findCourseByTitle(String(body.course));
      if (!course) return res.status(400).json({ error: "Please choose a valid course." });
      const existing = await Enrollment.findOne({ student: user._id, course: course._id });
      if (existing) {
        // Keep the admin-selected course as the primary/displayed course while
        // retaining all other course enrollments.
        existing.enrolledAt = new Date(0);
        await existing.save();
      } else {
        await Enrollment.create({ student: user._id, course: course._id, enrolledAt: new Date(0) });
      }
    }
    return res.json({ message: "Student updated successfully.", student: await buildStudentRecord(user) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: "A student with this email already exists." });
    return next(error);
  }
}

router.put("/students/:id", ...adminOnly, updateStudent);
router.patch("/students/:id", ...adminOnly, updateStudent);

router.delete("/students/:id", ...adminOnly, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid student ID." });
    const user = await User.findOneAndDelete({ _id: req.params.id, role: "student" });
    if (!user) return res.status(404).json({ error: "Student not found." });
    await Enrollment.deleteMany({ student: user._id });
    await LearningProgress.deleteMany({ student: user._id });
    return res.json({ message: "Student deleted successfully.", student: { id: String(user._id), name: user.name, email: user.email } });
  } catch (error) { return next(error); }
});

module.exports = router;
