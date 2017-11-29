
const { join, resolve } = require("path");
const r = require("./result");
const r_require = r.to(require);

const hasDependency = (pjson, name, kind = "dependencies") =>
    !r.get(pjson, [kind, name]).error;
const hasPeerDependency = (pjson, name) =>
    hasDependency(pjson, name, "peerDependencies");

module.exports = function compile({ root: unresolved, cache, destination })
{
    const root = resolve(unresolved);
    const r_pjson = r_require(join(root, "package.json"));

    if (error.is(r_pjson))
        throw Errors.NotPackage(root);

    const r_node = r_get(r_pjson.ok, ["engines", "node"]);
    const node = r_node.error ? process.version : r_node.ok;

    if (error.is(r_node))
        console.warn(Messages.NoNode(root, node));

    const r_transforms = r_get(r_pjson.ok, ["isomorphic", "transforms"]);
    const transforms = error.is(r_transforms) ?
        getDefaultTransforms(node, r_pjson.ok) : r_transforms.ok;

    const r_entrypoints = r_get(r_pjson.ok, ["isomorphic", "entrypoints"]);
    const entrypoints = error.is(r_entrypoints) ? [] : r_entrypoints.ok;

    const exclude = ["**/node_modules", "*/build"];

    return runtime(<project { ...{ root, exclude, transforms, cache, destination, entrypoints } } />);
}

function getDefaultTransforms(node, pjson)
{
    const options =
    {
        node,
        "react": hasDependency(pjson, "react") || hasPeerDependency(pjson, "react"),
        "generic-jsx": hasDependency(pjson, "generic-jsx") || hasPeerDependency(pjson, "generic-jsx")
    };

    return [
        {
            "match": "**/*.js",
            "transform": "isomorphic-javascript",
            "options": {
                "babel": {
                    "presets": [
                        ["isomorphic-preset", options]
                    ]
                }
            }
        }
    ];
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
}

function toResult(f)
{
    return function ()
    {
        try
        {
            return ok(f.apply(this, arguments));
        }
        catch (error)
        {
            return { error };
        }
    }
}
