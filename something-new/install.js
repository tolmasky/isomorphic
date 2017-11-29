
const { dirname, join, resolve } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const { createHash } = require("crypto");

const uuid = require("uuid");
const spawn = require("@await/spawn").verbose;

const tmp = (path = join("/tmp", uuid())) =>
    !existsSync(path) ? path : tmp();
const SHARED_DEPENDENCIES = join(__dirname, "isomorphic");
const isLocal = name => name.startsWith("/") || name.startsWith("./");
const getPackageChecksum = require("./get-package-checksum");


module.exports = async function install(entry, name)
{
    if (isLocal(name))
    {
        const checksum = getPackageChecksum(name);
        const lock = require(join(name, "package-lock.json"));

        return { name, checksum, lock };
    }

    if (entry && existsSync(install.path(entry)))
        return entry;

    const workspace = join(tmp(), `${name}-container`);
    const lockfile = join(workspace, "package-lock.json");

    execSync(`mkdir -p ${workspace}`);

    if (entry)
        writeFileSync(lockfile, JSON.stringify(entry.lock, null, 2), "utf-8");

    await spawn("npm", ["init", "-y"], { cwd: workspace, env: process.env });
    await spawn("npm", ["install", name, "--save"], { cwd: workspace, env: process.env });

    const lockfileContents = readFileSync(lockfile, "utf-8");
    const checksum = getChecksum(lockfileContents);

    if (entry && entry.checksum !== checksum)
        throw new Error("Lockfile unexpectedly changed.");

    const lock = entry && entry.lock || JSON.parse(lockfileContents);
    const path = install.path({ name, checksum });

    if (!existsSync(path))
    {
        await spawn("mkdir", ["-p", dirname(path)]);
        await spawn("mv", [workspace, path]);
    }

    return { name, checksum, lock };
}

module.exports.path = function ({ name, checksum })
{
    if (isLocal(name))
        return name;

    return join(SHARED_DEPENDENCIES, checksum.replace(/\//g, "_"), name);
}

function getChecksum(string)
{
    return "sha512-" + createHash("sha512")
        .update(string)
        .digest("base64");
}
