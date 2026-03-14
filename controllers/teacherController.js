const bcrypt    = require("bcryptjs");
const { query } = require("../config/db");
const toDate = v => v ? String(v).slice(0,10) : null;

exports.list = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        t.id, t.subject, t.qualification, t.experience, t.phone, t.gender,
        t.address, t.emergency_contact AS emergencyContact,
        t.department, t.salary,
        DATE_FORMAT(t.dob, '%Y-%m-%d') AS dob,
        DATE_FORMAT(t.join_date, '%Y-%m-%d') AS joinDate,
        t.contract_type AS contractType, t.status,
        t.employee_id AS employeeId,
        u.email, u.avatar_url,
        CASE
          WHEN u.name LIKE 'Mr. %'   THEN 'Mr.'
          WHEN u.name LIKE 'Ms. %'   THEN 'Ms.'
          WHEN u.name LIKE 'Mrs. %'  THEN 'Mrs.'
          WHEN u.name LIKE 'Dr. %'   THEN 'Dr.'
          WHEN u.name LIKE 'Prof. %' THEN 'Prof.'
          ELSE 'Mr.'
        END AS prefix,
        TRIM(REGEXP_REPLACE(u.name, '^(Mr\\.|Ms\\.|Mrs\\.|Dr\\.|Prof\\.)\\s*', '')) AS fullNameNoPrefix,
        SUBSTRING_INDEX(TRIM(REGEXP_REPLACE(u.name, '^(Mr\\.|Ms\\.|Mrs\\.|Dr\\.|Prof\\.)\\s*', '')), ' ', 1) AS firstName,
        SUBSTRING_INDEX(TRIM(REGEXP_REPLACE(u.name, '^(Mr\\.|Ms\\.|Mrs\\.|Dr\\.|Prof\\.)\\s*', '')), ' ', -1) AS lastName
      FROM teachers t
      JOIN users u ON u.id = t.user_id
      ORDER BY t.id
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
      SELECT t.id, t.subject, t.qualification, t.experience, t.phone, t.gender,
        t.address, t.emergency_contact AS emergencyContact,
        t.department, t.salary, t.contract_type AS contractType, t.status,
        t.employee_id AS employeeId,
        DATE_FORMAT(t.dob, '%Y-%m-%d') AS dob,
        DATE_FORMAT(t.join_date, '%Y-%m-%d') AS joinDate,
        u.email, u.avatar_url,
        CASE
          WHEN u.name LIKE 'Mr. %'   THEN 'Mr.'
          WHEN u.name LIKE 'Ms. %'   THEN 'Ms.'
          WHEN u.name LIKE 'Mrs. %'  THEN 'Mrs.'
          WHEN u.name LIKE 'Dr. %'   THEN 'Dr.'
          WHEN u.name LIKE 'Prof. %' THEN 'Prof.'
          ELSE 'Mr.'
        END AS prefix,
        TRIM(REGEXP_REPLACE(u.name, '^(Mr\\.|Ms\\.|Mrs\\.|Dr\\.|Prof\\.)\\s*', '')) AS fullNameNoPrefix,
        SUBSTRING_INDEX(TRIM(REGEXP_REPLACE(u.name, '^(Mr\\.|Ms\\.|Mrs\\.|Dr\\.|Prof\\.)\\s*', '')), ' ', 1) AS firstName,
        SUBSTRING_INDEX(TRIM(REGEXP_REPLACE(u.name, '^(Mr\\.|Ms\\.|Mrs\\.|Dr\\.|Prof\\.)\\s*', '')), ' ', -1) AS lastName
      FROM teachers t JOIN users u ON u.id=t.user_id WHERE t.id=?
    `, [req.params.id]);
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, prefix, firstName, lastName, subject, phone, dob, gender, qualification, experience, employeeId, address, emergencyContact, department, salary, joinDate, contractType, status } = req.body;
    const fullName = name || `${prefix || ""} ${firstName || ""} ${lastName || ""}`.trim();
    const hashed = await bcrypt.hash(password || "changeme", 12);
    const [uResult] = await query("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'Teacher')", [fullName, email, hashed]);
    const [tResult] = await query(
      `INSERT INTO teachers(user_id,subject,phone,dob,gender,qualification,experience,employee_id,address,emergency_contact,department,salary,join_date,contract_type,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uResult.insertId, subject||null, phone||null, toDate(dob), gender||null, qualification||null, experience||null, employeeId||null, address||null, emergencyContact||null, department||null, salary||null, toDate(joinDate), contractType||"Permanent", status||"Active"]
    );
    res.status(201).json({ id: tResult.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { firstName, lastName, prefix, email, ...rest } = req.body;
    const [rows] = await query("SELECT user_id FROM teachers WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) {
      if (email) await query("UPDATE users SET email=? WHERE id=?", [email, rows[0].user_id]);
      if (firstName || lastName) await query("UPDATE users SET name=? WHERE id=?", [`${prefix||""} ${firstName||""} ${lastName||""}`.trim(), rows[0].user_id]);
    }

    const fieldMap = {
      subject: "subject", phone: "phone", dob: "dob", gender: "gender",
      qualification: "qualification", experience: "experience", employeeId: "employee_id",
      address: "address", emergencyContact: "emergency_contact", department: "department",
      salary: "salary", joinDate: "join_date", contractType: "contract_type", status: "status"
    };

    const sets = [], vals = [];
    for (const [k, col] of Object.entries(fieldMap)) {
      if (rest[k] !== undefined) { sets.push(`${col}=?`); vals.push(rest[k] || null); }
    }
    if (sets.length > 0) {
      vals.push(req.params.id);
      await query(`UPDATE teachers SET ${sets.join(",")} WHERE id=?`, vals);
    }
    res.json({ id: req.params.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await query("SELECT user_id FROM teachers WHERE id=?", [req.params.id]);
    await query("DELETE FROM teachers WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) await query("DELETE FROM users WHERE id=?", [rows[0].user_id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.schedule = async (req, res) => {
  try {
    const [rows] = await query("SELECT name,schedule,room,grade FROM courses WHERE teacher_id=?", [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = `/uploads/avatars/${req.file.filename}`;
    const [rows] = await query("SELECT user_id FROM teachers WHERE id=?", [req.params.id]);
    if (rows[0]?.user_id) await query("UPDATE users SET avatar_url=? WHERE id=?", [url, rows[0].user_id]);
    res.json({ avatar_url: url });
  } catch (err) { res.status(500).json({ error: err.message }); }
};