const { query } = require("../config/db");

exports.students = async (req, res) => {
  try {
    const [rows] = await query("SELECT grade, COUNT(*) as count, SUM(status='Active') as active FROM students GROUP BY grade ORDER BY grade");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.payments = async (req, res) => {
  try {
    const [rows] = await query("SELECT DATE_FORMAT(created_at,'%Y-%m') as month, SUM(paid) as revenue, SUM(amount-paid) as pending FROM payments GROUP BY month ORDER BY month");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.attendance = async (req, res) => {
  try {
    const [rows] = await query("SELECT date, SUM(status='Present') as present, SUM(status='Absent') as absent FROM attendance GROUP BY date ORDER BY date DESC LIMIT 30");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.courses = async (req, res) => {
  try {
    const [rows] = await query("SELECT c.name,c.grade,c.credits,COUNT(e.id) as enrolled,c.max_students FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id GROUP BY c.id ORDER BY c.id");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
