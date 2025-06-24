"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pool = void 0;
var _pg = _interopRequireDefault(require("pg"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  Pool
} = _pg.default;
const pool = exports.pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true'
});