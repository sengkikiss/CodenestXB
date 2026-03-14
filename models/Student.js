// backend/models/Student.js — query helpers for Student
const { query } = require("../config/db");
const StudentModel = {
  findAll:  ()    => query("SELECT * FROM students ORDER BY id"),
  findById: (id)  => query("SELECT * FROM students WHERE id=$1",[id]),
};
module.exports = StudentModel;
