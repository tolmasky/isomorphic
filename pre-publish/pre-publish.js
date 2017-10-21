"use strict";

const path = require("path");
const resolve = aPath => path.resolve(__dirname, aPath);

const options = require("commander")
    .option("--source [source]", "source", resolve(".."))
    .option("--destination [destination]", "destination", resolve("./build-products"))
    .option("--cache [cache]", "cache", resolve("./build-products/cache"))
    .option("--no-register")
    .parse(process.argv);

require("./bootstrap");//({ babelRegister: !options.noRegister });

const compile = require("isomorphic-compile");
const { source, cache, destination } = options;

compile(source);
//build(getBuildSettings({ source, cache, destination })).then(console.log);
