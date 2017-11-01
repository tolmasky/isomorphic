"use strict";

const { join, resolve } = require("path");
const { existsSync } = require("fs");
const { spawnSync, execSync } = require("child_process");
const randomstring = require("randomstring");

const relative = path => resolve(join(__dirname, path));

require("./bootstrap");

const compile = require("../isomorphic-compile");
//const compileCLI = relative("../isomorphic-compile/bin/isomorphic-compile-cli");
const cache = relative("build-products/cache");
const now = require("moment")().format('MMMM Do YYYY, h.mm.ss A');
const destination = relative(`build-products/${now}`);


["examples", "isomorphic", "isomorphic-compile", "isomorphic-preset", "isomorphic-serialize"]
    .map(name => compile(
    {
        root: relative(join("..", name)),
        cache,
        destination: join(destination, name)
    }));

execSync("npm install", { cwd: join(destination, "examples"), stdio:[0,1,2] });
execSync("cp -r isomorphic examples/node_modules/", { cwd: destination, stdio:[0,1,2] });
execSync("node routes.js", { cwd: join(destination, "examples"), stdio:[0,1,2] });

console.log(`Completed at ${destination}`);
