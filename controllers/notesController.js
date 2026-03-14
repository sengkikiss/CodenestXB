const { query } = require("../config/db");

exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let rows;
    if (userRole === "Student") {
      // Only notes from courses the student is enrolled in
      [rows] = await query(`
        SELECT n.*, u.name AS teacherName, c.name AS courseName
        FROM notes n
        LEFT JOIN teachers t ON t.id = n.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN courses c ON c.id = n.course_id
        WHERE n.course_id IN (
          SELECT e.course_id FROM enrollments e
          JOIN students s ON s.id = e.student_id
          WHERE s.user_id = ?
        )
        ORDER BY n.pinned DESC, n.created_at DESC
      `, [userId]);
    } else if (userRole === "Teacher") {
      // Teacher sees all notes for courses they teach (including admin-posted notes)
      [rows] = await query(`
        SELECT n.*, u.name AS teacherName, c.name AS courseName
        FROM notes n
        LEFT JOIN teachers t ON t.id = n.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN courses c ON c.id = n.course_id
        WHERE n.course_id IN (
          SELECT id FROM courses WHERE teacher_id = (
            SELECT id FROM teachers WHERE user_id = ?
          )
        )
        ORDER BY n.pinned DESC, n.created_at DESC
      `, [userId]);
    } else {
      // Admin/Staff see all
      [rows] = await query(`
        SELECT n.*, u.name AS teacherName, c.name AS courseName
        FROM notes n
        LEFT JOIN teachers t ON t.id = n.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN courses c ON c.id = n.course_id
        ORDER BY n.pinned DESC, n.created_at DESC
      `);
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title, content, courseId, targetGrade, category, pinned } = req.body;
    const [tRows] = await query("SELECT id FROM teachers WHERE user_id=?", [req.user.id]);
    const teacherId = tRows[0]?.id || null;

    // Teacher can only post to courses they teach
    if (req.user.role === "Teacher") {
      if (!teacherId) return res.status(403).json({ error: "Teacher profile not found" });
      if (!courseId)  return res.status(400).json({ error: "Course is required" });
      const [cRows] = await query("SELECT id FROM courses WHERE id=? AND teacher_id=?", [courseId, teacherId]);
      if (!cRows[0])  return res.status(403).json({ error: "You can only post notes to courses you teach" });
    }

    const [result] = await query(
      "INSERT INTO notes(title,content,teacher_id,course_id,target_grade,category,pinned) VALUES(?,?,?,?,?,?,?)",
      [title, content, teacherId, courseId||null, targetGrade||null, category||"General", pinned ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { title, content, pinned, category, courseId } = req.body;
    await query("UPDATE notes SET title=?,content=?,pinned=?,category=?,course_id=? WHERE id=?",
      [title, content, pinned ? 1 : 0, category, courseId||null, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await query("DELETE FROM notes WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};