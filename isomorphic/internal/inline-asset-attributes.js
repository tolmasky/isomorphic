

const { existsSync } = require("fs");
const { dirname, join, relative } = require("path");

const Route = require("route-parser");
const ProjectPath = getProjectPath();

const route = getRoutes(ProjectPath);
const checksums = getChecksums(ProjectPath);
const URLKeys = { "script": "src", "link": "href", "img": "src", "html": "src" };


module.exports = function (tag, absolutePath)
{
    const entrypoint = "~/" + relative(ProjectPath, absolutePath);
    const output = "~" + route(entrypoint);
    const publicURL = output.substr(1);
    const integrity = checksums[output];
    const bustedURL = publicURL + `?integrity=${integrity}`;
    const crossOrigin = "anonymous";
    const props = { [URLKeys[tag]]:  bustedURL, integrity, crossOrigin };

    if (tag !== "html")
        return props;

    const Component = require(absolutePath);

    return { __internal_props: { Component, entrypoint: entrypoint.replace(/^~\//g, "/"), script: props } };
}

function getProjectPath()
{
    if (typeof window !== "undefined")
        return "/";

    return (function find(path)
    {
        if (existsSync(join(path, "package.json")))
            return path;
        
        return find(dirname(path));
    })(require.main.filename);
}

function getRoutes(aProjectPath)
{
    if (typeof window !== "undefined")
        return () => { };

    const pjson = require(join(aProjectPath, "package.json"));
    const routes = pjson.isomorphic.entrypoints;

    const compiled = Object.keys(routes)
        .map(input =>
        ({
            definition: routes[input],
            input: Route(input),
            output: Route(routes[input].output)
        }));

    return function (path)
    {
        const relativePath = path.substr(1);

        for (const route of compiled)
        {
            const captures = route.input.match(relativePath);

            if (captures === false)
                continue;

            return route.output.reverse(captures);
        }

        throw new Error(`Could not find matching entrypoint for ${path}`);
    }
}

function getChecksums(aProjectPath)
{
    if (typeof window !== "undefined")
        return { };

    const pjson = require(join(aProjectPath, "package.json"));
    
    return pjson["isomorphic-checksums"];
}