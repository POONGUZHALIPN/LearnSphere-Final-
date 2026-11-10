const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ") || !authHeader.slice(7).trim()) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: "Authentication is not configured" });
  }

  try {
    const decoded = jwt.verify(authHeader.slice(7).trim(), process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const user = await User.findById(decoded.sub).select("_id email role").lean();
    if (!user) return res.status(401).json({ success: false, message: "User account is no longer available" });
    req.user = { id: String(user._id), sub: String(user._id), email: user.email, role: user.role };
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.name === "NotBeforeError") {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
    return next(error);
  }
}

module.exports = { authenticateToken };
