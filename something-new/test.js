
const { join, dirname, resolve } = require("path");
const { existsSync, writeFileSync, readFileSync } = require("fs");

const { r, ok, error } = require("./result");
const map = require("./await-map");

const progress = require("./progress");
const install = progress(
    (_, name) => `Installing ${name}...`,
    require("./install"));
install.path = require("./install").path;
const r_require = r.to(require);

const peer = name => resolve(dirname(__dirname), name);



module.exports = async function ({ package: unresolved })
{try {
    const project = resolve(unresolved);
    const r_package = r_require(join(project, "package.json"));

    if (error.is(r_package))
        throw Errors.NotPackage(project);

    const lockfile = join(project, "isomorphic-lock.json");
    const [lock, configuration] = await installed(
        ok.or(r_require(lockfile), { }),
        getConfiguration(r_package.ok));

    writeFileSync(lockfile, JSON.stringify(lock, null, 2), "utf-8");

    require(configuration["package://*"][0])();
    } catch(e) { console.log(e) }
};

/*
const r_node = r.get(r_package.ok, ["engines", "node"]);
    const node = ok.or(r_node, process.version);

    if (error.is(r_node))
        console.warn(Messages.NoNode(project, node));

*/

async function installed(lock, configuration)
{
    return await map.accum(
        async (previous, description) => 
        {
            const [name, options] = [].concat(description);

            const entry = await install(previous[name], name);
            const lock = { ...previous, [name]: entry };

            return [lock, [install.path(entry), options]];
        }, lock, configuration);
}

function getConfiguration(package)
{
    return {
        ...forDevelopment(getDefaultConfiguration()),
        ...ok.or(r.get(package, ["isomorphic"]), { })
    };
    
    function forDevelopment(configuration)
    {
        if (!process.env.ISOMORPHIC_DEVELOPMENT)
            return configuration;

        const { dirname } = require("path");
        const peer = name => resolve(dirname(__dirname), name);

        return Object
            .keys(configuration)
            .reduce((accum, key) =>
                ({ ...accum, [key]: peer(configuration[key]) }), { });
    }
}

function getDefaultConfiguration()
{
    return {
        "package://*": "isomorphic-node",
        "node://(*_/):name.js(x)": "isomorphic-javascript",
        "asset://(*_/):name.less": "isomorphic-less",
        "asset://(*_/):name.sass": "isomorphic-sass",
        "asset://(*_/):name.js(x)": "isomorphic-bundle-js"
    };
}


function rjson(path, or)
{
    return r.or(r.to(require)(path), { });
}

async function reduce(reducer, iterable, accum)
{
    for (const item of iterable)
        accum = await reducer(accum, item)

    return accum;
}

Errors =
{
    NotPackage: root => Error(`${root} has no package.json. ` +
        `\`isomorphic/compile\` must be run a project with a package.json.`)
}

Messages =
{
    NoNode: (root, using) => `No node version specified in the \`engines\` ` +
        `field of the package.json of \`${root}\`. \`isomorphic/compile\` ` +
        `uses this standard field to autoamtically apply the right babel ` +
        `transformations. The currently running ${using} will be used, but ` +
        `this should be treated as an error or you will not have reproducible ` +
        `builds. Find out more here: https://docs.npmjs.com/files/package.json#engines`
};

(async function ()
{
    await (module.exports)({ package: "." });
})();
