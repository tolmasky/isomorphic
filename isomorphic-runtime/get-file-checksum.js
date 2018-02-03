
const { createHash } = require("crypto");
const { readFileSync } = require("fs");


module.exports = function getFileChecksum(path)
{
    return "sha512-" + createHash("sha512")
        .update(readFileSync(path, "utf-8"))
        .digest("base64");
}
