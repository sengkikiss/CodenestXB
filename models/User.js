// backend/models/User.js — query helpers for User
const { query } = require("../config/db");
const UserModel = {
  findAll:  ()    => query("SELECT * FROM users ORDER BY id"),
  findById: (id)  => query("SELECT * FROM users WHERE id=$1",[id]),
};
module.exports = UserModel;
