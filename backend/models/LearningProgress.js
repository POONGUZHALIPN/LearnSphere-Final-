const mongoose = require("mongoose");

const learningProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },
    completedLessons: {
      type: [String],
      default: []
    },
    totalLessons: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    quizPassed: {
      type: Boolean,
      default: false
    },
    quizScore: {
      type: Number,
      default: null,
      min: 0
    },
    quizAttempts: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

learningProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.models.LearningProgress || mongoose.model("LearningProgress", learningProgressSchema);
