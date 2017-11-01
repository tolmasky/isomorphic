
const { existsSync } = require("fs");
const { dirname, join, relative } = require("path");

const ProjectPath = getProjectPath();
const checksums = getChecksums(ProjectPath);
const URLKeys = { "script": "src", "link": "href", "img": "src" };


module.exports = function (tag, path)
{
    const withinProjectPath = "~/" + relative(ProjectPath, path);

    if (tag === "html")
        return { absolute: path, relative: withinProjectPath };

    const integrity = checksums[path];
    const bustedURL = path + `?integrity=${integrity}`;
    const crossOrigin = "anonymous";

    return { [URLKeys[tag] || "URL"]:  bustedURL, integrity, crossOrigin };
}

function getProjectPath()
{
    return (function find(path)
    {
        if (existsSync(join(path, "package.json")))
            return path;
        
        return find(dirname(path));
    })(require.main.filename);
}

function getChecksums(aProjectPath)
{
    const pjson = require(join(aProjectPath, "package.json"));
    
    return pjson["isomorphic-checksums"];
}