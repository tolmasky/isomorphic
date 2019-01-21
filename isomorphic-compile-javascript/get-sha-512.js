const crypto = require("crypto");

module.exports = function getSha512(string)
{
    return crypto.createHash("sha512")
        .update(string)
        .digest("base64")
        .replace(/\//g, "_");
}
