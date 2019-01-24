const { is } = require("@algebraic/type");
const build = require("../isomorphic-build.js");
const Target = require("../target");

const { basename, extname, resolve } = require("path");
const glob = require("fast-glob");
const moment = require("moment");
const expand = path => path.replace(/^~/, process.env.HOME);

const options = require("commander")
    .version(require("../package").version)
    .option("-c, --concurrency [concurrency]",
        "Max number of test files running at the same time (Default: CPU cores)",
        require("os").cpus().length)
    .option("--cache", undefined)
    .option("-o, --output [output]", "", `${process.cwd()}/output`)
    .option("-r, --root [root]", "", process.cwd())
    .parse(process.argv);

const patterns = options.args.length <= 0 ? [] : options.args;

(async function ()
{
    const entrypoints = Array.from(new Set(
        [].concat(...patterns.map(pattern => glob.sync(pattern)))))
        .map(path => resolve(path));

    if (entrypoints.length <= 0)
        return fail(
            `\nNo files to process, perhaps there is a typo in your pattern:` +
            `\n${patterns.map(pattern => `   ${pattern}`).join("\n")}\n`);

    const cache = expand(options.cache || options.output + "/cache");
    const destination = expand(options.output);
    const toDestination = entrypoint =>
        `${destination}/${basename(entrypoint, extname(entrypoint))}.bundle.js`;

    const targets = entrypoints
        .map(entrypoint => [entrypoint, toDestination(entrypoint)])
        .map(([entrypoint, destination ]) =>
            Target({ entrypoint, destination }));

    const start = Date.now();
    await build({ ...options, cache, targets });

    console.log("TIME: " + (Date.now() - start));
})();


function fail(...args)
{
    console.error(...args);
    process.exit(1);
}

