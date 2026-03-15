const bcrypt        = require("bcryptjs");
const { query }     = require("../config/db");
const { signToken } = require("../config/jwt");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: "Invalid credentials" });

    let teacherId = null, studentId = null, staffId = null;
    if (user.role === "Teacher") {
      const [tRows] = await query("SELECT id FROM teachers WHERE user_id=?", [user.id]);
      teacherId = tRows[0]?.id || null;
    } else if (user.role === "Student") {
      const [sRows] = await query("SELECT id FROM students WHERE user_id=?", [user.id]);
      studentId = sRows[0]?.id || null;
    } else if (user.role === "Staff") {
      const [sfRows] = await query("SELECT id FROM staff WHERE user_id=?", [user.id]);
      staffId = sfRows[0]?.id || null;
    }

    const token = signToken({ id: user.id, role: user.role, name: user.name, email: user.email });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url, teacherId, studentId, staffId } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const [result] = await query("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [name, email, hashed, role]);
    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await query("SELECT id,name,email,role,avatar_url FROM users WHERE id=?", [req.user.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: "Name and email are required" });
    const [existing] = await query("SELECT id FROM users WHERE email=? AND id!=?", [email, req.user.id]);
    if (existing[0]) return res.status(400).json({ error: "Email already in use" });
    await query("UPDATE users SET name=?, email=? WHERE id=?", [name, email, req.user.id]);
    const [rows] = await query("SELECT id,name,email,role,avatar_url FROM users WHERE id=?", [req.user.id]);
    res.json({ message: "Profile updated", user: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "All fields required" });
    if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const [rows] = await query("SELECT password FROM users WHERE id=?", [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 12);
    await query("UPDATE users SET password=? WHERE id=?", [hashed, req.user.id]);
    res.json({ message: "Password updated successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadAvatar = async (req, res) => {
  try {
    // Support both Cloudinary and local upload
    let url;
    if (req.file?.path && req.file.path.startsWith("http")) {
      // Cloudinary upload - path contains the URL
      url = req.file.path;
    } else if (req.file?.filename) {
      // Local upload
      url = `/uploads/avatars/${req.file.filename}`;
    } else {
      return res.status(400).json({ error: "No file uploaded" });
    }
    await query("UPDATE users SET avatar_url=? WHERE id=?", [url, req.user.id]);
    res.json({ avatar_url: url });
  } catch (err) { res.status(500).json({ error: err.message }); }
};