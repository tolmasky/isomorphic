
const { dirname, basename, extname, join, relative } = require("path");

const { readdirSync, copyFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;

const { internalModuleStat } = process.binding("fs");
const tstat = path => ["file", "directory"][internalModuleStat(path)];
const getFileChecksum = require("./get-file-checksum");

const micromatch = require("micromatch");

const entrypoints = require("./entrypoints");


module.exports = function project({ root, destination, cache, exclude, ...rest })
{
    mkdirp(dirname(destination));

    const transforms = rest.transforms.map(({ match, ...rest }) =>
        ({ match: toMatcher(match), ...rest }));
    const routes = rest.entrypoints;

    return  <checksums  { ... { root, destination } }>
                <entrypoints { ...{ root, destination, cache, routes } }>
                    <item   path = { root }
                            cache = { mkdirp(cache) }
                            exclude = { toMatcher(exclude) }
                            transforms = { transforms }
                            destination = { destination } />
                </entrypoints>
            </checksums>
}

function checksums({ root, destination, children })
{
    const assets = children.reduce(function (assets, child)
    {
        for (const asset of child.assets)
        {
            if (asset.indexOf(root) === 0)
                assets.add("~/" + relative(root, asset));
            else if (asset.indexOf(destination) === 0)
                assets.add("~/" + relative(destination, asset));
            else if (asset.indexOf("~/") === 0)
                assets.add(asset);
            else
                throw new Error(`Asset ${path} must be within project ${root}`);
        }

        return assets;
    }, new Set());
    const checksums = Array
        .from(assets)
        .reduce(function (checksums, asset)
        {
            const path = asset.replace(/~\//g, destination + "/");
            const checksum = getFileChecksum(path);

            return Object.assign(checksums, { [asset]: checksum });
        }, Object.create(null));
    const pjsonPath = join(destination, "package.json");
    const pjson = Object.assign({ },
        require(pjsonPath),
        { "isomorphic-checksums": checksums });

    writeFileSync(pjsonPath, JSON.stringify(pjson, null, 2), "utf-8");
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

    return nested;
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

