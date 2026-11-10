const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const User = require("./models/User");
const Course = require("./models/Course");
const Enrollment = require("./models/Enrollment");
const LearningProgress = require("./models/LearningProgress");
const Notification = require("./models/Notification");
const Message = require("./models/Message");

const invalidUser = new User({});
assert.ok(invalidUser.validateSync(), "User should require name, email and password");
const invalidCourse = new Course({});
assert.ok(invalidCourse.validateSync(), "Course should require title, description and duration");
const invalidEnrollment = new Enrollment({});
assert.ok(invalidEnrollment.validateSync(), "Enrollment should require student and course");
const invalidProgress = new LearningProgress({});
assert.ok(invalidProgress.validateSync(), "LearningProgress should require student, course and totalLessons");
const invalidNotification = new Notification({});
assert.ok(invalidNotification.validateSync(), "Notification should require recipient and message");
const invalidMessage = new Message({});
assert.ok(invalidMessage.validateSync(), "Message should require sender, recipient and text");

const enrollmentIndexes = Enrollment.schema.indexes();
assert.ok(enrollmentIndexes.some(([keys, options]) => keys.student === 1 && keys.course === 1 && options.unique === true));
const progressIndexes = LearningProgress.schema.indexes();
assert.ok(progressIndexes.some(([keys, options]) => keys.student === 1 && keys.course === 1 && options.unique === true));
const userIndexes = User.schema.indexes();
assert.ok(userIndexes.some(([keys, options]) => keys.email === 1 && options.unique === true));

console.log("Task 11 schema checks passed: six models, required fields and unique indexes.");
// No database connection is opened in Task 11. Task 12 adds MongoDB integration.
void mongoose;
