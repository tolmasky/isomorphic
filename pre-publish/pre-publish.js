"use strict";

const { join, resolve } = require("path");
const { existsSync } = require("fs");
const { spawnSync } = require("child_process");
const randomstring = require("randomstring");

const relative = path => resolve(join(__dirname, path));


const compileCLI = relative("../isomorphic-compile/bin/isomorphic-compile-cli");
const cache = relative("build-products/cache");
const destination = getUniqueDestination();

spawnSync("node", [ '--require',
  '/Users/tolmasky/Development/isomorphic/pre-publish/bootstrap']);

["isomorphic-compile"].map(name =>
    spawnSync("node",
    [
        "--require", relative("./bootstrap"),
        compileCLI,
        "--root", relative(join("..", name)),
        "--cache", cache,
        "--destination", join(destination, name)
    ], { stdio:[0,1,2] } ));

console.log(`Completed at ${destination}`);

function getUniqueDestination()
{
    const path = relative(`build-products/${randomstring.generate(
    {
        length: 12,
        charset: "abcdefghijklmnopqrstuvwxyz0123456789"
    })}`);

    if (existsSync(path))
        return getUniqueDestination();

    return path;
}
