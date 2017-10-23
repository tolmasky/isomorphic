"use strict";

const { join, resolve } = require("path");
const { existsSync } = require("fs");
const { spawnSync } = require("child_process");
const randomstring = require("randomstring");

const relative = path => resolve(join(__dirname, path));

require("./bootstrap");

const compile = require("../isomorphic-compile");
//const compileCLI = relative("../isomorphic-compile/bin/isomorphic-compile-cli");
const cache = relative("build-products/cache");
const destination = getUniqueDestination();


["isomorphic-compile", "isomorphic-preset", "isomorphic-serialize"]
    .map(name => compile(
    {
        root: relative(join("..", name)),
        cache,
        destination: join(destination, name)
    }));

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
