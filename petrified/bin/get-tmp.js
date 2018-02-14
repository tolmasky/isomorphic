const uuid = require("uuid").v4;
const { tstat } = require("sf-fs");


module.exports = function tmp(extname)
{
    const path = `/tmp/${uuid()}${extname || ""}`;

    return tstat(path) ? tmp() : path;
}
