

const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    }

    if (!token)
      return res.status(401).json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  ALWAYS return _id 
    req.user = await User.findById(decoded.id).select("_id name email role");

    if (!req.user)
      return res.status(401).json({ message: "User not found" });

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
