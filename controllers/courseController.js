const { query } = require("../config/db");

exports.list = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT c.*, 
        u.name AS teacherName,
        t.id AS teacherId,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolledCount
      FROM courses c
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN users u ON u.id = t.user_id
      ORDER BY c.id
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.get = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT c.*, u.name AS teacherName,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrolledCount
      FROM courses c
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN users u ON u.id = t.user_id
      WHERE c.id=?
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });

    // Get chapters
    const [chapters] = await query(`
      SELECT ch.*, 
        (SELECT COUNT(*) FROM chapter_materials cm WHERE cm.chapter_id = ch.id) AS materialCount
      FROM chapters ch WHERE ch.course_id=? ORDER BY ch.order_no, ch.id
    `, [req.params.id]);

    // Get materials for each chapter
    for (const ch of chapters) {
      const [mats] = await query("SELECT * FROM chapter_materials WHERE chapter_id=? ORDER BY order_no, id", [ch.id]);
      ch.materials = mats;
    }

    // Get enrolled students
    const [students] = await query(`
      SELECT s.id, u.name, u.email, u.avatar_url, s.grade, s.section,
        SUBSTRING_INDEX(u.name,' ',1) AS firstName,
        SUBSTRING_INDEX(u.name,' ',-1) AS lastName
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN users u ON u.id = s.user_id
      WHERE e.course_id=?
    `, [req.params.id]);

    res.json({ ...rows[0], chapters, students });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, code, teacherId, grade, section, maxStudents, duration, schedule, startDate, endDate, room, credits, description } = req.body;
    const [result] = await query(
      `INSERT INTO courses(name,code,teacher_id,grade,section,max_students,duration,schedule,start_date,end_date,room,credits,description)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [name, code||null, teacherId||null, grade||null, section||null, maxStudents||30, duration||null, schedule||null, startDate||null, endDate||null, room||null, credits||3, description||null]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, code, teacherId, grade, section, maxStudents, duration, schedule, startDate, endDate, room, credits, description, status } = req.body;
    await query(
      `UPDATE courses SET name=?,code=?,teacher_id=?,grade=?,section=?,max_students=?,duration=?,schedule=?,start_date=?,end_date=?,room=?,credits=?,description=?,status=? WHERE id=?`,
      [name, code||null, teacherId||null, grade||null, section||null, maxStudents||30, duration||null, schedule||null, startDate||null, endDate||null, room||null, credits||3, description||null, status||"Active", req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await query("DELETE FROM enrollments WHERE course_id=?", [req.params.id]);
    await query("DELETE FROM chapter_materials WHERE chapter_id IN (SELECT id FROM chapters WHERE course_id=?)", [req.params.id]);
    await query("DELETE FROM chapters WHERE course_id=?", [req.params.id]);
    await query("DELETE FROM courses WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.enroll = async (req, res) => {
  try {
    const { studentId } = req.body;
    await query("INSERT IGNORE INTO enrollments(student_id,course_id) VALUES(?,?)", [studentId, req.params.id]);
    res.json({ message: "Enrolled" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.unenroll = async (req, res) => {
  try {
    await query("DELETE FROM enrollments WHERE course_id=? AND student_id=?", [req.params.id, req.params.studentId]);
    res.json({ message: "Removed" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.enrolledStudents = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT s.id, u.name, u.email, u.avatar_url, s.grade, s.section,
        SUBSTRING_INDEX(u.name,' ',1) AS firstName,
        SUBSTRING_INDEX(u.name,' ',-1) AS lastName
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN users u ON u.id = s.user_id
      WHERE e.course_id=?
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── CHAPTERS ──────────────────────────────────────────────────────────────
exports.getChapters = async (req, res) => {
  try {
    const [chapters] = await query("SELECT * FROM chapters WHERE course_id=? ORDER BY order_no, id", [req.params.id]);
    for (const ch of chapters) {
      const [mats] = await query("SELECT * FROM chapter_materials WHERE chapter_id=? ORDER BY order_no, id", [ch.id]);
      ch.materials = mats;
    }
    res.json(chapters);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createChapter = async (req, res) => {
  try {
    const { title, description, orderNo } = req.body;
    const [result] = await query(
      "INSERT INTO chapters(course_id,title,description,order_no,created_by) VALUES(?,?,?,?,?)",
      [req.params.id, title, description||null, orderNo||0, req.user.id]
    );
    res.status(201).json({ id: result.insertId, course_id: req.params.id, title, description, materials: [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateChapter = async (req, res) => {
  try {
    const { title, description, orderNo } = req.body;
    await query("UPDATE chapters SET title=?,description=?,order_no=? WHERE id=?", [title, description||null, orderNo||0, req.params.chapterId]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteChapter = async (req, res) => {
  try {
    await query("DELETE FROM chapter_materials WHERE chapter_id=?", [req.params.chapterId]);
    await query("DELETE FROM chapters WHERE id=?", [req.params.chapterId]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── MATERIALS ─────────────────────────────────────────────────────────────
exports.addMaterial = async (req, res) => {
  try {
    const { title, type, content, orderNo } = req.body;
    const filePath = req.file ? `/uploads/materials/${req.file.filename}` : null;
    const [result] = await query(
      "INSERT INTO chapter_materials(chapter_id,title,type,content,file_path,order_no) VALUES(?,?,?,?,?,?)",
      [req.params.chapterId, title, type||"note", content||null, filePath, orderNo||0]
    );
    res.status(201).json({ id: result.insertId, chapter_id: req.params.chapterId, title, type, content, file_path: filePath });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteMaterial = async (req, res) => {
  try {
    await query("DELETE FROM chapter_materials WHERE id=?", [req.params.materialId]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
exports.studentCourses = async (req, res) => {
  try {
    const [stuRows] = await query("SELECT id FROM students WHERE user_id=?", [req.params.userId]);
    if (!stuRows[0]) return res.json([]);
    const [rows] = await query(`
      SELECT c.*, u.name AS teacherName
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN teachers t ON t.id = c.teacher_id
      LEFT JOIN users u ON u.id = t.user_id
      WHERE e.student_id = ?
    `, [stuRows[0].id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};