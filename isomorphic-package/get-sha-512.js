const crypto = require("crypto");

module.exports = getSha512;

function getSha512(string)
{
    return crypto.createHash("sha512")
        .update("string:" + string)
        .digest("base64")
        .replace(/\//g, "_");
}

getSha512.JSON = function getSha512JSON(object)
{
    return getSha512("JSON:" + JSON.stringify(object));
}
