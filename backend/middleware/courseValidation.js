const requiredFields = [
  ["courseName", "Course name is required"],
  ["courseCode", "Course code is required"],
  ["instructor", "Instructor is required"],
  ["duration", "Duration is required"],
  ["category", "Category is required"]
];

const validateCourse = (req, res, next) => {
  for (const [field, message] of requiredFields) {
    if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
      return res.status(400).json({
        success: false,
        message
      });
    }
  }
  next();
};

module.exports = validateCourse;
