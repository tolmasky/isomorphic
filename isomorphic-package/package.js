const { data, string, serialize } = require("@algebraic/type");


const Package = data `Package` (
    filename    => string,
    checksum    => string );

module.exports = Package;

Package.for = (function ()
{
    const { dirname, resolve } = require("path");
    const tstat = require("./tstat");
    const isPackageDirectory = filename => tstat(`${filename}/package.json`);
    const findPackageDirectory = filename =>
        isPackageDirectory(filename) ?
            filename :
            filename === "/" ?
                false :
                findPackageDirectory(dirname(filename));
    const Resolution = require("./resolution");
    const getSha512 = require("./get-sha-512");

    return function PackageFor(target)
    {
        const directory = findPackageDirectory(target);

        if (!directory)
            throw Error(`Could not find package for ${target}`);

        const filename = `${directory}/package.json`;
        const resolution = Resolution.of(filename);
        const checksum =
            getSha512(JSON.stringify(serialize(Resolution, resolution)));

        return Package({ filename, checksum });
    }
})();


/*
const initPackage = (function()
{
    const { existsSync, readFileSync } = require("fs");
    const getSha512 = require("./get-sha-512");
    const { spawnSync } = require("child_process");
    const hasGit = spawnSync("which", ["git"]).status === 0;
    const git = !hasGit ?
        () => false :
        (cwd, ...args) => (({ status, stdout }) =>
            status !== 0 ?
                false :
                stdout)
            (spawnSync("git", args, { cwd }));

    return function initPackage(filename)
    {
        const packageJSONPath = `${filename}/package.json`;
        const packageJSONChecksum = getSha512(readFileSync(packageJSONPath));
        const gitData = (function ()
        {
            const tracked = git(filename,
                ["ls-files", "--error-unmatch", packageJSONPath]).status !== 0;

            if (!tracked)
                return false;

            const gitRevision = git(filename, "rev-parse", "HEAD");
            const gitDiff = git(filename, "diff", ".");
            const gitStatus = git(filename, "status", ".");

            return { gitRevision, gitDiff, gitStatus };
        })();

        const data = { packageJSONChecksum, ...gitData };
        const checksum = getSha512(JSON.stringify(data));

        return Package({ filename, checksum });
    }
})();
*/

Package.resolve = require("./resolve-from");

