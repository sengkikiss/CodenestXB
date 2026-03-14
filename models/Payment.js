// backend/models/Payment.js — query helpers for Payment
const { query } = require("../config/db");
const PaymentModel = {
  findAll:  ()    => query("SELECT * FROM payments ORDER BY id"),
  findById: (id)  => query("SELECT * FROM payments WHERE id=$1",[id]),
};
module.exports = PaymentModel;
