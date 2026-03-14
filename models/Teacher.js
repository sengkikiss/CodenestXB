// backend/models/Teacher.js — query helpers for Teacher
const { query } = require("../config/db");
const TeacherModel = {
  findAll:  ()    => query("SELECT * FROM teachers ORDER BY id"),
  findById: (id)  => query("SELECT * FROM teachers WHERE id=$1",[id]),
};
module.exports = TeacherModel;
