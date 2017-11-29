
const { readFileSync, writeFileSync, existsSync } = require("fs");

exports.read = readFileSync;
exports.write = writeFileSync;
exports.exists = existsSync;
