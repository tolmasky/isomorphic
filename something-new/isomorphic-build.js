
const { join, dirname, resolve } = require("path");
const { write } = require("./fs-sync");

const { r, ok, error } = require("./result");
const r_require = r.to(require);

const map = require("./await-map");

const progress = require("./progress");
const install = require("./install");


module.exports = async function (options)
{
    const source = resolve(options.source);
    const destination = resolve(options.destination);

    const r_package = r_require(join(source, "package.json"));

    if (error.is(r_package))
        throw Errors.NotPackage(source);

    const lockfile = join(source, "isomorphic-lock.json");
    const [lock, configuration] = await installed(
        ok.or(r_require(lockfile), { }),
        getConfiguration(r_package.ok));

    write(lockfile, JSON.stringify(lock, null, 2), "utf-8");

    const [location, _] = configuration["package://*"];
    const handler = require(location);

    const routes = configuration;
    const c = { routes, cache: "", source, destination, package: r_package.ok };

    handler({ configuration: c });
//    return runtime(<handler { ... { source, destination } } />);
};

async function installed(lock, configuration)
{
    return await map.accum(
        async function (previous, description)
        {
            const [name, options] = [].concat(description);

            const message = `Installing ${name}...`;
            const entry = await progress(message, install)
                (previous[name], name);
            const lock = { ...previous, [name]: entry };

            return [lock, [install.path(entry), options]];
        }, lock, configuration);
}

function getConfiguration(pjson)
{
    return {
        ...forDevelopment(getDefaultConfiguration()),
        ...ok.or(r.get(pjson, ["isomorphic"]), { })
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
        "package://*": "isomorphic-package",
        "package.module://(*_/):name.js(x)": "isomorphic-javascript",
        "package.entrypoint://(*_/):name.less": "isomorphic-less",
        "package.entrypoint://(*_/):name.sass": "isomorphic-sass",
        "package.entrypoint://(*_/):name.js(x)": "isomorphic-bundle-js",
        //"package.asset://*": "isomorphic-checksum"
    };
        /*"constants.babel-options": {
            "presets": ["isomorphic-preset"]
        },*/
}

Errors =
{
    NotPackage: source => Error(`${source} has no package.json. ` +
        `\`isomorphic-build\` must be run on a project with a package.json.`)
}
