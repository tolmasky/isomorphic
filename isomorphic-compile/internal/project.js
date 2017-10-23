
const { dirname, extname, join } = require("path");

const { readdirSync, copyFileSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;

const { internalModuleStat } = process.binding("fs");
const tstat = path => ["file", "directory"][internalModuleStat(path)];

const micromatch = require("micromatch");


module.exports = function project({ root, destination, cache, exclude, transforms, assets })
{
    mkdirp(dirname(destination));

    const optimized = transforms.map(({ match, ...rest }) =>
        ({ match: toMatcher(match), ...rest }));

    return  <item   path = { root }
                    cache = { mkdirp(cache) }
                    exclude = { toMatcher(exclude) }
                    transforms = { optimized }
                    destination = { destination } />;
}

function item({ path, exclude, ...rest })
{
    if (exclude(path))
        return [];

    const type = { file, directory }[tstat(path)];

    return <type { ...{ path, exclude, ...rest } } />;
}

function file({ path, destination, cache, transforms })
{
    const match = transforms.find(transform => transform.match(path));

    if (!match)
        return <copy { ...{ path, destination } }/>;

    const { transform: location, ...rest } = match;
    const transform = require(location);

    return  <copy { ...{ destination } }>
                <transform { ...rest } { ...{ cache, path } } />
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

function optimize(transforms)
{
    return transforms.map(({ match, ...rest }) =>
    ({ match: toMatcher(transform.match), ...rest }));
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

