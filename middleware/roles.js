// backend/middleware/roles.js
// RBAC — restrict routes to specific roles.
// Usage: router.get("/", auth, roles("Admin","Staff"), controller.list)
module.exports = (...allowed) => (req, res, next) => {
  if (!allowed.includes(req.user?.role))
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  next();
};
