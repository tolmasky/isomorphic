
const { dirname, basename, extname, join, relative } = require("path");

const { readdirSync, copyFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;

const { internalModuleStat } = process.binding("fs");
const tstat = path => ["file", "directory"][internalModuleStat(path)];
const getFileChecksum = require("./get-file-checksum");

const micromatch = require("micromatch");

const { r, ok, error } = require("../something-new/result");


module.exports = function node({ configuration, options })
{
    const r_node = r.get(configuration.package, ["engines", "node"]);
    const node = ok.or(r_node, process.version);

    if (error.is(r_node))
        console.warn(Messages.NoNode(configuration.source, node));

/*    mkdirp(dirname(destination));

    const transforms = rest.transforms.map(({ match, ...rest }) =>
        ({ match: toMatcher(match), ...rest }));

    return  <item   path = { configuration.source }
                    cache = { mkdirp(configuration.cache) }
                    exclude = { toMatcher(exclude) }
                    transforms = { transforms }
                    destination = { configuration.destination } />*/
}
Messages =
{
    NoNode: (source, using) => `No node version specified in the ` +
        `package.json \`engines\` field of:\n\n${source}\n\n` +
        `\`isomorphic-package\` uses this standard field to automatically apply ` +
        `the right\nbabel transformations. The currently running ${using} ` + 
        `will be used for now,\nbut this should be treated as an error or you` +
        ` may not have reproducible\nbuilds. Find out more here: ` +
        `https://docs.npmjs.com/files/package.json#engines`
};

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