
const transform = require("./babel-transform");
const filesystemCache = require("./filesystem-cache");


module.exports = function ({ cache, ...rest })
{
    return  <filesystemCache
                cache = { cache }
                transform = { <transform { ...rest } /> } />;
}
