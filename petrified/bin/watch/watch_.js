const { dirname } = require("path");

const { spawn } = require("child_process");
const { unlinkSync, readFileSync } = require("fs");
const { read } = require("sf-fs");

const executeOnFileChange = require("@isomorphic/execute-on-file-change");

const style = require("chalk").bgBlue.white.bold;
const announce = message => console.log(style(message));

const express = require("express");
const http = require("http");

const tmp = require("../get-tmp");
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.stack);
});

const injectionProxy = require("./injection-proxy");


module.exports = function watch({ source, destination, port })
{
    const socketPath = tmp(".sock");
    const injectionProxyServer = express()
        .use(injectionProxy({ proxiedSocketPath: socketPath }))
        .listen(port, () => console.log(`• Petrified running on port ${port}`));

    const builder = buildOnFileChange({ source });
    const deployer = deployOnFileChange({ socketPath, source: destination });

    builder.change([]);
}

function buildOnFileChange({ source })
{
    const match = `${source}/!(_site|_cache)(*|**)`;
    const execute = () => fork("• Building blog.runkit.com... ",
        "../petrified-cli", ["--dev", source]);
    const { emitter, change } = executeOnFileChange({ source, match, execute });

    emitter
        .on("change", outputFilesChanged(source))
        .on("execution-cancel", () => announce("• Canceling build due to file changes"))

    return { change };
}

function deployOnFileChange({ socketPath, source })
{
    const parent = dirname(source);
    const match = `${source}{/**{/*,},}`;
    const execute = () => (rm(socketPath, true),
        fork("• Deploying blog.runkit.com... ",
            "../serve", ["--socket", socketPath, source]));
console.log(match);
    const { emitter } = executeOnFileChange({ source: parent, match, execute });

    emitter
        .on("change", outputFilesChanged(source))
}

function fork(message, path, args)
{
    announce(message);

    return spawn("node", [require.resolve(path), ...args], { stdio: [0, 1, 2] });
}

function outputFilesChanged(source, changes)
{
    if (arguments.length === 1)
        return changes => outputFilesChanged(source, changes);

    console.log("• Detected file changes...");

    const concated = [].concat(...changes);
    const expanded = concated.length > 15 ? 10 : 15;

    const head = concated.slice(0, expanded);
    const rest = Math.max(concated.length - expanded, 0);

    const files = changes.map(({ path, action }) =>
        `  - ${path.substr(source.length)} was ${action}.`).join("\n") +
        (rest > 0 ? "\n  - and ${head.length - limit} more..." : "");

    console.log(files);
}

function rm (path, swallow)
{
    try
    {
        return unlinkSync(path);
    }
    catch (error)
    {
        if (!swallow)
            return error;
    }
}

