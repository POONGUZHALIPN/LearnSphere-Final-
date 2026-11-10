const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    // `title` is the normalized database field. The API maps it to the
    // Task 8/10-compatible `courseName` property.
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      default: "Course description will be updated soon."
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    durationLabel: {
      type: String,
      trim: true
    },
    courseCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 30
    },
    instructor: {
      type: String,
      trim: true,
      maxlength: 100
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

courseSchema.index({ status: 1, category: 1 });

module.exports = mongoose.models.Course || mongoose.model("Course", courseSchema);
