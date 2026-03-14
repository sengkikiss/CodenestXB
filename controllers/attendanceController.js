const { query } = require("../config/db");

exports.checkLocked = async (req, res) => {
  try {
    const { courseId, date } = req.query;
    const [rows] = await query(
      "SELECT COUNT(*) AS cnt FROM attendance WHERE course_id=? AND DATE(date)=DATE(?)",
      [courseId, date]
    );
    res.json({ locked: rows[0].cnt > 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.list = async (req, res) => {
  try {
    const { date, courseId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    let sql = `
      SELECT a.id, a.status, DATE_FORMAT(a.date,'%Y-%m-%d') AS date,
        u.name AS studentName, c.name AS courseName, u.avatar_url
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
      LEFT JOIN courses c ON c.id = a.course_id
      WHERE 1=1
    `;
    const params = [];
    if (userRole === "Teacher") {
      sql += " AND a.course_id IN (SELECT id FROM courses WHERE teacher_id=(SELECT id FROM teachers WHERE user_id=?))";
      params.push(userId);
    }
    if (courseId) { sql += " AND a.course_id=?"; params.push(courseId); }
    if (date)     { sql += " AND DATE(a.date)=DATE(?)"; params.push(date); }
    sql += " ORDER BY a.date DESC, u.name ASC";
    const [rows] = await query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.mark = async (req, res) => {
  try {
    const { records, date, courseId } = req.body;
    if (!courseId) return res.status(400).json({ error: "courseId is required" });

    const [existing] = await query(
      "SELECT COUNT(*) AS cnt FROM attendance WHERE course_id=? AND DATE(date)=DATE(?)",
      [courseId, date]
    );
    if (existing[0].cnt > 0) {
      return res.status(403).json({ error: "Attendance for this date is already saved and cannot be changed." });
    }

    if (req.user.role === "Teacher") {
      const [tRows] = await query("SELECT id FROM teachers WHERE user_id=?", [req.user.id]);
      const teacherId = tRows[0]?.id;
      const [cRows] = await query("SELECT id FROM courses WHERE id=? AND teacher_id=?", [courseId, teacherId]);
      if (!cRows[0]) return res.status(403).json({ error: "You don't teach this course" });
    }

    for (const r of records) {
      await query(
        "INSERT INTO attendance(student_id,course_id,date,status,marked_by) VALUES(?,?,?,?,?)",
        [r.studentId, courseId, date, r.status, req.user.id]
      );
    }
    res.json({ message: "Saved", count: records.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId, date } = req.query;
    if (!courseId) return res.status(400).json({ error: "courseId required" });
    const [students] = await query(`
      SELECT s.id AS studentId, u.name, u.avatar_url,
        SUBSTRING_INDEX(u.name,' ',1) AS firstName,
        SUBSTRING_INDEX(u.name,' ',-1) AS lastName
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN users u ON u.id = s.user_id
      WHERE e.course_id = ? ORDER BY u.name
    `, [courseId]);

    let attendanceMap = {};
    if (date) {
      const [records] = await query(
        "SELECT student_id, status FROM attendance WHERE course_id=? AND DATE(date)=DATE(?)",
        [courseId, date]
      );
      records.forEach(r => { attendanceMap[r.student_id] = r.status; });
    }
    res.json(students.map(s => ({ ...s, status: attendanceMap[s.studentId] || "Present" })));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Get all dates attendance was taken for a course
exports.getCourseDates = async (req, res) => {
  try {
    const { courseId } = req.query;
    // Use subquery to avoid non-aggregated columns in GROUP BY
    const [rows] = await query(`
      SELECT
        DATE_FORMAT(dt, '%Y-%m-%d') AS date,
        SUM(status = 'Present')     AS present,
        SUM(status = 'Absent')      AS absent,
        SUM(status = 'Late')        AS late,
        COUNT(*)                    AS total
      FROM (
        SELECT DATE(a.date) AS dt, a.status
        FROM attendance a
        WHERE a.course_id = ?
      ) sub
      GROUP BY dt
      ORDER BY dt DESC
    `, [courseId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Get attendance records for a specific course+date
exports.getDateRecords = async (req, res) => {
  try {
    const { courseId, date } = req.query;
    const [rows] = await query(`
      SELECT a.status, u.name, u.avatar_url, s.id AS studentId,
        SUBSTRING_INDEX(u.name,' ',1) AS firstName,
        SUBSTRING_INDEX(u.name,' ',-1) AS lastName
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
      WHERE a.course_id=? AND DATE(a.date)=DATE(?)
      ORDER BY u.name
    `, [courseId, date]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.studentAttendance = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT a.id, a.status, DATE_FORMAT(a.date,'%Y-%m-%d') AS date, c.name AS courseName
      FROM attendance a
      LEFT JOIN courses c ON c.id = a.course_id
      WHERE a.student_id=? ORDER BY a.date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.report = async (req, res) => {
  try {
    const { courseId, from, to } = req.query;
    // Subquery approach avoids only_full_group_by issues entirely
    let inner = `SELECT DATE(a.date) AS dt, a.status FROM attendance a LEFT JOIN courses c ON c.id=a.course_id WHERE 1=1`;
    const params = [];
    if (courseId) { inner += " AND a.course_id=?"; params.push(courseId); }
    if (from)     { inner += " AND DATE(a.date)>=?"; params.push(from); }
    if (to)       { inner += " AND DATE(a.date)<=?"; params.push(to); }

    const sql = `
      SELECT
        DATE_FORMAT(dt,'%Y-%m-%d')  AS date,
        SUM(status='Present')       AS present,
        SUM(status='Absent')        AS absent,
        SUM(status='Late')          AS late,
        COUNT(*)                    AS total
      FROM (${inner}) sub
      GROUP BY dt
      ORDER BY dt DESC
      LIMIT 60
    `;
    const [rows] = await query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.summary = async (req, res) => {
  try {
    const { courseId } = req.query;
    let where = courseId ? "WHERE a.course_id=?" : "";
    const params = courseId ? [courseId] : [];
    const [rows] = await query(`
      SELECT s.id, u.name, u.avatar_url,
        COUNT(*)                              AS total,
        SUM(a.status='Present')               AS present,
        SUM(a.status='Absent')                AS absent,
        SUM(a.status='Late')                  AS late,
        ROUND(SUM(a.status='Present')*100/COUNT(*),1) AS rate
      FROM attendance a
      JOIN students s ON s.id = a.student_id
      JOIN users u ON u.id = s.user_id
      ${where}
      GROUP BY s.id, u.name, u.avatar_url
      ORDER BY rate ASC
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};