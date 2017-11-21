
const { dirname, basename } = require("path");
const { spawnSync } = require("child_process");

const platform = require("os").platform();
//const shasum_each = `sh -c "openssl dgst -sha1 -binary {} | base64 | xargs echo {}"`;
const shasum = platform === "darwin" ? "shasum -a 512" : "sha512sum";
const shasum_done = "openssl dgst -sha512 -binary | base64";

module.exports = function getPackageSha512Sum(path)
{
    const cwd = dirname(path);
    const name = basename(path);
    const command = [
        `find ${name}`,
        `-path "${name}/node_modules"`,
        `-prune -o -not -name .DS_Store`,
        `-type f -exec ${shasum} {} \\;`
    ].join(" ");

    const { stdout } = spawnSync("sh", ["-c", command + " | " + shasum_done], { cwd });
    const output = stdout.toString();

    return "sha512-" + output.substr(0, output.length - 1);
}
