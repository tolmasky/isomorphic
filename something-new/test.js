
const { join, resolve } = require("path");
const { writeFileSync } = require("fs");

const { r, ok, error } = require("./result");

const hasDependency = (pjson, name, kind = "dependencies") =>
    !r.get(pjson, [kind, name]).error;
const hasPeerDependency = (pjson, name) =>
    hasDependency(pjson, name, "peerDependencies");
    
//const plugin = require("./plugin");
const progress = require("./progress");
const install = progress(
    (_, dependency) => `Installing ${dependency}`,
    require("./install"));

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

    const r_isomorphic = r.get(r_package.ok, ["isomorphic"]);
    const isomorphic = DEFAULT_ISOMORPHIC();//ok.or(r_isomorphic, DEFAULT_ISOMORPHIC());

    const lock = ok.or(r_json("isomorphic-lock.json"), { });
    
    for (const route of Object.keys(isomorphic))
    {
        const [dependency] = [].concat(isomorphic[route]);
        const { path, entry } = await install(lock[dependency], dependency);

        lock[dependency] = entry;
    }
    
    writeFileSync(join(project, "isomorphic-lock.json"), JSON.stringify(lock, null, 2), "utf-8");
};


function DEFAULT_ISOMORPHIC()
{
    return {
        "node://package.json": "ramda",
        "asset://(*_/):name.less": "lodash",
        "asset://(*_/):name.sass": "babylon",
        "asset://(*_/):name.js(x)": "react"
    };
/*
    return {
        "node://package.json": "isomorphic-node",
        "asset://(*_/):name.less": "isomorphic-less",
        "asset://(*_/):name.sass": "isomorphic-sass",
        "asset://(*_/):name.js(x)": "isomorphic-bundle-js"
    };*/
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
