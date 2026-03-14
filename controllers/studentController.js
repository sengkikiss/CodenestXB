const bcrypt    = require("bcryptjs");
const { query } = require("../config/db");
const toDate = v => v ? String(v).slice(0,10) : null;

exports.list = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        s.id, s.status,
        s.section                            AS major,
        s.grade                              AS yearOfStudy,
        s.phone, s.gender, s.address,
        DATE_FORMAT(s.dob, '%Y-%m-%d')       AS dob,
        DATE_FORMAT(s.enrolled_at, '%Y-%m-%d') AS enrolled,
        u.email, u.avatar_url,
        SUBSTRING_INDEX(u.name, ' ', 1)      AS firstName,
        SUBSTRING_INDEX(u.name, ' ', -1)     AS lastName
      FROM students s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.id
    `);
    // Replace nulls with empty strings
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
      FROM students s JOIN users u ON u.id=s.user_id WHERE s.id=?
    `, [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, firstName, lastName, major, yearOfStudy, phone, dob, gender, address, enrolled, status } = req.body;
    const fullName = name || `${firstName || ""} ${lastName || ""}`.trim();
    const hashed = await bcrypt.hash(password || "changeme", 12);
    const [uResult] = await query("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'Student')", [fullName, email, hashed]);
    const [sResult] = await query(
      `INSERT INTO students
        (user_id,grade,section,phone,dob,gender,address,enrolled_at,status)
       VALUES(?,?,?,?,?,?,?,?,?)`,
      [
        uResult.insertId,
        yearOfStudy||null, major||null, phone||null, toDate(dob), gender||null,
        address||null, toDate(enrolled), status||"Active"
      ]
    );
    res.status(201).json({ id: sResult.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { firstName, lastName, email, ...rest } = req.body;

    // Update users table
    const [rows] = await query("SELECT user_id FROM students WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) {
      if (email) await query("UPDATE users SET email=? WHERE id=?", [email, rows[0].user_id]);
      if (firstName || lastName) await query("UPDATE users SET name=? WHERE id=?", [`${firstName||""} ${lastName||""}`.trim(), rows[0].user_id]);
    }

    // Map to DB columns
    const fieldMap = {
      yearOfStudy: "grade", major: "section", phone: "phone", gender: "gender",
      address: "address",
      status: "status"
    };

    const sets = [], vals = [];
    for (const [k, col] of Object.entries(fieldMap)) {
      if (rest[k] !== undefined) { sets.push(`${col}=?`); vals.push(rest[k] || null); }
    }

    if (sets.length > 0) {
      vals.push(req.params.id);
      await query(`UPDATE students SET ${sets.join(",")} WHERE id=?`, vals);
    }

    res.json({ id: req.params.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await query("SELECT user_id FROM students WHERE id=?", [req.params.id]);
    await query("DELETE FROM students WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) await query("DELETE FROM users WHERE id=?", [rows[0].user_id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/avatars/${req.file.filename}`;
    const [rows] = await query("SELECT user_id FROM students WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) await query("UPDATE users SET avatar_url=? WHERE id=?", [url, rows[0].user_id]);
    res.json({ avatar_url: url });
  } catch (err) { res.status(500).json({ error: err.message }); }
};