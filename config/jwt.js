// backend/config/jwt.js
// JWT sign / verify helpers.

const jwt = require("jsonwebtoken");

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

/** Sign a payload and return token string */
const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

/** Verify a token, returns decoded payload or throws */
const verifyToken = (token) => jwt.verify(token, SECRET);

module.exports = { signToken, verifyToken };
