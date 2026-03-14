const { query } = require("../config/db");

exports.list = async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT p.*, u.name AS student_name
      FROM payments p
      JOIN students s ON s.id = p.student_id
      JOIN users u ON u.id = s.user_id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { studentId, amount, discount, type, method, dueDate, status, remarks } = req.body;
    const inv = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const paidAmt = status === "Paid" ? (Number(amount) - Number(discount || 0)) : 0;
    const [result] = await query(
      `INSERT INTO payments(invoice_no,student_id,amount,discount,paid,type,method,due_date,status,remarks,paid_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
      [inv, studentId, amount, discount || 0, paidAmt, type, method || null,
       dueDate || null, status, remarks || null,
       status === "Paid" ? new Date() : null]
    );
    res.status(201).json({ id: result.insertId, invoice_no: inv });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.invoice = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT p.*, u.name AS student_name
       FROM payments p JOIN students s ON s.id=p.student_id JOIN users u ON u.id=s.user_id
       WHERE p.id=?`, [req.params.id]
    );
    rows[0] ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.studentPayments = async (req, res) => {
  try {
    const [rows] = await query("SELECT * FROM payments WHERE student_id=? ORDER BY created_at DESC", [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await query(
      "UPDATE payments SET status=?, paid_at=? WHERE id=?",
      [status, status === "Paid" ? new Date() : null, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.report = async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, SUM(amount) AS revenue, COUNT(*) AS count
       FROM payments WHERE status='Paid' GROUP BY month ORDER BY month`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};