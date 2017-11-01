
const { existsSync } = require("fs");
const { dirname, join } = require("path");

const checksums = getChecksums();
const URLKeys = { "script": "src", "link": "href", "img": "src" };


module.exports = function ({ URL, tag, ...rest })
{
    const integrity = checksums[URL];
    const bustedURL = URL + `?integrity=${integrity}`;
    const crossOrigin = "anonymous";

    return { ...rest, [URLKeys[tag] || "URL"]:  bustedURL, integrity, crossOrigin };
}

function getChecksums()
{
    const pjson = (function find(path)
    {
        if (existsSync(join(path, "package.json")))
            return require(join(path, "package.json"));
        
        return find(dirname(path));
    })(require.main.filename);
    
    return pjson["isomorphic-checksums"];
}