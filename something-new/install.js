
const { dirname, join, resolve } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const { createHash } = require("crypto");

const uuid = require("uuid");
const spawn = require("@await/spawn").silent;

const tmp = (path = join("/tmp", uuid())) =>
    !existsSync(path) ? path : tmp();
const SHARED_DEPENDENCIES = join(__dirname, "isomorphic");


module.exports = async function install(entry, dependency)
{
    const workspace = join(tmp(), `${dependency}-container`);
    const lockfile = join(workspace, "package-lock.json");

    execSync(`mkdir -p ${workspace}`);

    if (entry)
        writeFileSync(lockfile, JSON.stringify(entry.lock, null, 2), "utf-8");

    await spawn("npm", ["init", "-y"], { cwd: workspace });
    await spawn("npm", ["install", dependency, "--save"], { cwd: workspace });

    const lockfileContents = readFileSync(lockfile, "utf-8");
    const checksum = getChecksum(lockfileContents);

    if (entry && entry.checksum !== checksum)
        throw new Error("Lockfile unexpectedly changed.");

    const lock = entry && entry.lock || JSON.parse(lockfileContents);
    const path = join(SHARED_DEPENDENCIES, checksum.replace(/\//g, "_"), dependency);

    if (!existsSync(path))
    {
        await spawn("mkdir", ["-p", dirname(path)]);
        await spawn("mv", [workspace, path]);
    }

    return { path, entry: { checksum, lock } };
}

function getChecksum(string)
{
    return "sha512-" + createHash("sha512")
        .update(string)
        .digest("base64");
}

