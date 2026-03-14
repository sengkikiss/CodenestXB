// backend/models/Attendance.js — query helpers for Attendance
const { query } = require("../config/db");
const AttendanceModel = {
  findAll:  ()    => query("SELECT * FROM attendances ORDER BY id"),
  findById: (id)  => query("SELECT * FROM attendances WHERE id=$1",[id]),
};
module.exports = AttendanceModel;
