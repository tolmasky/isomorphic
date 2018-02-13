const { resolve } = require("path");
const express = require("express");

const options = require("commander")
    .option("--port [port]", 0)
    .option("--socket [socket]")
    .parse(process.argv);

//if (options.args.length !== 1)
//    throw new Error("serve requires source argument.")

const source = options.args[0];
const { port, socket } = options;

const server = express()
    .use(express.static(source))
    .listen(socket || port, function listening()
    {
//        process.send("ready");
    });
