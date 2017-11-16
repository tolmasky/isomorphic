
const { dirname, join } = require("path");
const { execSync } = require("child_process");
const { existsSync, readFileSync } = require("fs");
const { createHash } = require("crypto");

const uuid = require("uuid").v4;
const DEPENDENCIES_PATH = "~/isomorphic";

const hasOwnProperty = Object.prototype.hasOwnProperty;

const progress = require("./progress");
const install = progress(
    dependency => `Installing ${dependency}`,
    require("./install"));


module.exports = function plugin(lockfile, description)
{
    if (arguments.length < 2)
        return description => plugin(lockfile, description);

    const [dependency, options] = [].concat(description);console.log(dependency);
    const checksum = hasOwnProperty.call(lockfile, dependency) ?
        lockfile[dependency].checksum : install(dependency);

    return [join(DEPENDENCIES_PATH, checksum.replace(/\//g, "_")), options || { }];
};

(async function () {
console.log("ALL DONE! " + JSON.stringify(await install("ramda")));
})();