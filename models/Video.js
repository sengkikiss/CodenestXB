// backend/models/Video.js — query helpers for Video
const { query } = require("../config/db");
const VideoModel = {
  findAll:  ()    => query("SELECT * FROM videos ORDER BY id"),
  findById: (id)  => query("SELECT * FROM videos WHERE id=$1",[id]),
};
module.exports = VideoModel;
