// backend/models/Course.js — query helpers for Course
const { query } = require("../config/db");
const CourseModel = {
  findAll:  ()    => query("SELECT * FROM courses ORDER BY id"),
  findById: (id)  => query("SELECT * FROM courses WHERE id=$1",[id]),
};
module.exports = CourseModel;
