// backend/models/Staff.js — query helpers for Staff
const { query } = require("../config/db");
const StaffModel = {
  findAll:  ()    => query("SELECT * FROM staffs ORDER BY id"),
  findById: (id)  => query("SELECT * FROM staffs WHERE id=$1",[id]),
};
module.exports = StaffModel;
