const { is } = require("@algebraic/type");
const build = require("../isomorphic-build.js");

const { resolve } = require("path");
const glob = require("fast-glob");
const moment = require("moment");

const options = require("commander")
    .version(require("../package").version)
    .option("-c, --concurrency [concurrency]",
        "Max number of test files running at the same time (Default: CPU cores)",
        require("os").cpus().length)
    .option("-o, --output [output]", "")
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

    const start = Date.now();
    const result = await build(entrypoints, options);
    const time = Date.now() - start;
})();


function fail(...args)
{
    console.error(...args);
    process.exit(1);
}

