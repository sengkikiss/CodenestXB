const bcrypt    = require("bcryptjs");
const { query } = require("../config/db");
const toDate = v => v ? String(v).slice(0,10) : null;

exports.list = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        s.id, s.role, s.department, s.phone, DATE_FORMAT(s.dob,'%Y-%m-%d') AS dob, s.gender,
        s.address, s.emergency_contact AS emergencyContact,
        s.salary, DATE_FORMAT(s.join_date,'%Y-%m-%d') AS joinDate,
        s.shift, s.contract_type AS contractType, s.status,
        s.employee_id AS employeeId,
        u.email, u.avatar_url,
        SUBSTRING_INDEX(u.name, ' ', 1)  AS firstName,
        SUBSTRING_INDEX(u.name, ' ', -1) AS lastName
      FROM staff s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.id
    `);
    const clean = rows.map(r => {
      const obj = {};
      for (const k of Object.keys(r)) obj[k] = r[k] ?? "";
      return obj;
    });
    res.json(clean);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.get = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT s.*, u.name, u.email, u.avatar_url,
        SUBSTRING_INDEX(u.name, ' ', 1)  AS firstName,
        SUBSTRING_INDEX(u.name, ' ', -1) AS lastName
      FROM staff s JOIN users u ON u.id=s.user_id WHERE s.id=?
    `, [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, phone, dob, gender, address, emergencyContact, salary, joinDate, shift, contractType, status, employeeId } = req.body;
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();
    const hashed = await bcrypt.hash(password || "changeme", 12);
    const [uResult] = await query("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'Staff')", [fullName, email, hashed]);
    const [sResult] = await query(
      `INSERT INTO staff(user_id,role,department,phone,dob,gender,address,emergency_contact,salary,join_date,shift,contract_type,status,employee_id)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uResult.insertId, role||null, department||null, phone||null, toDate(dob), gender||null, address||null, emergencyContact||null, salary||null, toDate(joinDate), shift||"Morning", contractType||"Permanent", status||"Active", employeeId||null]
    );
    res.status(201).json({ id: sResult.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { firstName, lastName, email, ...rest } = req.body;
    const [rows] = await query("SELECT user_id FROM staff WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) {
      if (email) await query("UPDATE users SET email=? WHERE id=?", [email, rows[0].user_id]);
      if (firstName || lastName) await query("UPDATE users SET name=? WHERE id=?", [`${firstName||""} ${lastName||""}`.trim(), rows[0].user_id]);
    }

    const fieldMap = {
      role: "role", department: "department", phone: "phone", dob: "dob", gender: "gender",
      address: "address", emergencyContact: "emergency_contact", salary: "salary",
      joinDate: "join_date", shift: "shift", contractType: "contract_type",
      status: "status", employeeId: "employee_id"
    };

    const sets = [], vals = [];
    for (const [k, col] of Object.entries(fieldMap)) {
      if (rest[k] !== undefined) { sets.push(`${col}=?`); vals.push(rest[k] || null); }
    }
    if (sets.length > 0) {
      vals.push(req.params.id);
      await query(`UPDATE staff SET ${sets.join(",")} WHERE id=?`, vals);
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await query("SELECT user_id FROM staff WHERE id=?", [req.params.id]);
    await query("DELETE FROM staff WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) await query("DELETE FROM users WHERE id=?", [rows[0].user_id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/avatars/${req.file.filename}`;
    const [rows] = await query("SELECT user_id FROM staff WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) await query("UPDATE users SET avatar_url=? WHERE id=?", [url, rows[0].user_id]);
    res.json({ avatar_url: url });
  } catch (err) { res.status(500).json({ error: err.message }); }
};