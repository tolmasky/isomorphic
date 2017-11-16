
const { join, resolve } = require("path");
const { existsSync, writeFileSync } = require("fs");

const { r, ok, error } = require("./result");
const mapAccum = require("./await-map-accum");

const progress = require("./progress");
const install = progress(
    (_, name) => `Installing ${name}...`,
    require("./install"));
install.path = require("./install").path;


module.exports = async function ({ package: unresolved })
{
    const project = resolve(unresolved);
    const r_json = r.to(path => require(join(project, path)));
    const r_package = r_json("package.json");

    if (error.is(r_package))
        throw Errors.NotPackage(project);

    const r_node = r.get(r_package.ok, ["engines", "node"]);
    const node = ok.or(r_node, process.version);

    if (error.is(r_node))
        console.warn(Messages.NoNode(project, node));

    const [lock, configuration] = await installed(
        ok.or(r_json("isomorphic-lock.json"), { }),
        getConfiguration(r_package.ok));

    console.log(configuration);
    
    writeFileSync(join(project, "isomorphic-lock.json"), JSON.stringify(lock, null, 2), "utf-8");
};

async function installed(lock, configuration)
{
    return await mapAccum(
        async (previous, description) => 
        {
            const [name, options] = [].concat(description);
            const entry = await ensure(previous[name], name);
            const lock = { ...previous, [name]: entry };

            return [lock, [install.path(entry), options]];
        }, lock, configuration);

    async function ensure(entry, name)
    {
        if (entry && existsSync(install.path(entry)))
            return entry;
    
        return await install(entry, name);
    }
}

function getConfiguration(package)
{
    return {
        "node://package.json": "ramda",
        "asset://(*_/):name.less": "lodash",
        "asset://(*_/):name.sass": "babylon",
        "asset://(*_/):name.js(x)": "react",
        ...ok.or(r.get(package, ["isomorphic"]), { })
    };
/*
    return {
        "node://package.json": "isomorphic-node",
        "asset://(*_/):name.less": "isomorphic-less",
        "asset://(*_/):name.sass": "isomorphic-sass",
        "asset://(*_/):name.js(x)": "isomorphic-bundle-js"
    };*/
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
