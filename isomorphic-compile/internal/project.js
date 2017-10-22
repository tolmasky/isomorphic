
const { dirname, extname, join } = require("path");

const { readdirSync, copyFileSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;

const { internalModuleStat } = process.binding("fs");
const tstat = path => ["file", "directory"][internalModuleStat(path)];

const micromatch = require("micromatch");
const transform = require("./transform");


module.exports = function project({ root, destination, cache, exclude, assets })
{
    mkdirp(dirname(destination));
    mkdirp(cache);

    return  <item   path = { root }
                    cache = { cache }
                    exclude = { toMatcher(exclude) }
                    destination = { destination } />;
}

function item({ path, exclude, ...rest })
{
    if (exclude(path))
        return [];

    const type = { file, directory }[tstat(path)];

    return <type { ...{ path, exclude, ...rest } } />;
}
Error.stackTraceLimit = 1000;
function file({ path, destination, cache, transforms })
{
//    const { transform, checksum: transformChecksum } = findTransform.mcall(
//        refine(state, "find-checksum"), source, transforms) || { };
console.log(path);
    if (extname(path) !== ".js")
        return <copy { ...{ path, destination } }/>;

    const options = { 
        /*parserOpts: {
            "allowReturnOutsideFunction": true,
            "strictMode": false
        },*/
        presets: [
            ["isomorphic-preset", { node: "4.x.x", react: true }]
        ]
    };

    return  <copy destination = { destination }>
                <transform { ...{ cache, path, options } } />
            </copy>;
}

function copy({ children:[nested], destination, path = nested.include })
{
    copyFileSync(path, destination);
}

function directory({ path, destination, ...rest })
{
    mkdirp(destination);

    return readdirSync(path).map(name =>
        <item   path = { join(path, name) }
                destination = { join(destination, name) }
                { ...rest } />);
}

function toMatcher(match)
{
    if (Array.isArray(match))
    {
        const matchers = match.map(toMatcher);

        return path => matchers.some(matcher => matcher(path));
    }

    if (typeof match === "string")
    {
        const matcher = new micromatch.matcher(match);

        return path => matcher(path);
    }

    if (typeof match === "function")
        return match;

    return () => false;
}

