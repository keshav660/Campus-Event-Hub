


// backend/middleware/role.js
module.exports = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const userRole = req.user.role?.toLowerCase();
    const allowedRole = requiredRole.toLowerCase();

    // Treat organizer as admin-equivalent
    if (userRole !== allowedRole && !(userRole === "organizer" && allowedRole === "admin")) {
      return res.status(403).json({ message: "Access denied: insufficient permissions" });
    }

    next();
  };
};
