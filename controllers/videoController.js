const { query } = require("../config/db");
const fs   = require("fs");
const path = require("path");

exports.list = async (req, res) => {
  try {
    const userId   = req.user.id;
    const userRole = req.user.role;
    let rows;
    if (userRole === "Student") {
      [rows] = await query(`
        SELECT v.*, u.name AS teacherName, c.name AS courseName
        FROM videos v
        LEFT JOIN teachers t ON t.id = v.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN courses c ON c.id = v.course_id
        WHERE v.course_id IN (
          SELECT e.course_id FROM enrollments e
          JOIN students s ON s.id = e.student_id WHERE s.user_id = ?
        )
        ORDER BY v.created_at DESC
      `, [userId]);
    } else if (userRole === "Teacher") {
      [rows] = await query(`
        SELECT v.*, u.name AS teacherName, c.name AS courseName
        FROM videos v
        LEFT JOIN teachers t ON t.id = v.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN courses c ON c.id = v.course_id
        WHERE v.course_id IN (
          SELECT id FROM courses WHERE teacher_id = (
            SELECT id FROM teachers WHERE user_id = ?
          )
        )
        ORDER BY v.created_at DESC
      `, [userId]);
    } else {
      [rows] = await query(`
        SELECT v.*, u.name AS teacherName, c.name AS courseName
        FROM videos v
        LEFT JOIN teachers t ON t.id = v.teacher_id
        LEFT JOIN users u ON u.id = t.user_id
        LEFT JOIN courses c ON c.id = v.course_id
        ORDER BY v.created_at DESC
      `);
    }
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.upload = async (req, res) => {
  try {
    const { title, courseId, description, tags, videoUrl } = req.body;
    const [tRows] = await query("SELECT id FROM teachers WHERE user_id=?", [req.user.id]);
    const teacherId = tRows[0]?.id || null;

    if (req.user.role === "Teacher") {
      if (!teacherId) return res.status(403).json({ error: "Teacher profile not found" });
      if (!courseId)  return res.status(400).json({ error: "Course is required" });
      const [cRows] = await query("SELECT id FROM courses WHERE id=? AND teacher_id=?", [courseId, teacherId]);
      if (!cRows[0])  return res.status(403).json({ error: "You can only post videos to courses you teach" });
    }

    const videoFile    = req.files?.video?.[0];
    const thumbFile    = req.files?.thumbnail?.[0];
    const filePath     = videoUrl || (videoFile ? `/uploads/videos/${videoFile.filename}` : null);
    const thumbnailPath = thumbFile ? `/uploads/thumbnails/${thumbFile.filename}` : null;

    const [result] = await query(
      "INSERT INTO videos(title,teacher_id,course_id,file_path,thumbnail_path,description,tags) VALUES(?,?,?,?,?,?,?)",
      [title, teacherId, courseId||null, filePath, thumbnailPath, description||null, tags||null]
    );
    res.status(201).json({ id: result.insertId, ...req.body, thumbnail_path: thumbnailPath });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [rows] = await query("SELECT file_path, thumbnail_path FROM videos WHERE id=?", [req.params.id]);
    if (rows[0]?.file_path?.startsWith("/uploads")) {
      try { fs.unlinkSync(path.join(__dirname, "../", rows[0].file_path)); } catch (e) {}
    }
    if (rows[0]?.thumbnail_path?.startsWith("/uploads")) {
      try { fs.unlinkSync(path.join(__dirname, "../", rows[0].thumbnail_path)); } catch (e) {}
    }
    await query("DELETE FROM videos WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.stream = (req, res) => {
  const filePath = path.join(__dirname, "../uploads/videos", req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  const stat  = fs.statSync(filePath);
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace(/bytes=/, "").split("-").map(Number);
    const end = e || Math.min(s + 10 ** 6, stat.size - 1);
    res.writeHead(206, {
      "Content-Range": `bytes ${s}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - s + 1,
      "Content-Type": "video/mp4",
      "Cross-Origin-Resource-Policy": "cross-origin"
    });
    fs.createReadStream(filePath, { start: s, end }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "video/mp4",
      "Cross-Origin-Resource-Policy": "cross-origin"
    });
    fs.createReadStream(filePath).pipe(res);
  }
};