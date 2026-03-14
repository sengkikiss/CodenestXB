// backend/models/Note.js — query helpers for Note
const { query } = require("../config/db");
const NoteModel = {
  findAll:  ()    => query("SELECT * FROM notes ORDER BY id"),
  findById: (id)  => query("SELECT * FROM notes WHERE id=$1",[id]),
};
module.exports = NoteModel;
