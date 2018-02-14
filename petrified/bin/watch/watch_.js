const { dirname } = require("path");

const { spawn } = require("child_process");
const { unlinkSync } = require("fs");

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

module.exports = function watch({ source, destination, port })
{
    const match = `${source}/!(_site|_cache)(*|**)`;
    const socket = tmp(".sock");

    buildOnFileChange({ source });
    deployOnFileChange({ socket, source: destination });

    express()
        .get("*", function (request, response, next)
        {
            const { method, headers, originalUrl: path } = request;
            const options = { socketPath: socket, headers, method, path };
            const proxied = http.request(options, function (proxied)
            {
                response.writeHead(proxied.statusCode, proxied.headers);
                proxied.pipe(response);  
            })

            proxied.on("error", function (error)
            {
                if (error.code === "ENOENT" && error.address === socketPath)
                    return response.send(503, "Still Building");

                next(error)
            });

            request.pipe(proxied);
        })
        .listen(port, () => console.log("LISTENING"));
}

function buildOnFileChange({ source })
{
    const match = `${source}/!(_site|_cache)(*|**)`;
    const execute = () => fork("• Building blog.runkit.com... ",
        "../petrified-cli", ["--dev", source]);
    const { emitter } = executeOnFileChange({ source, match, execute });

    emitter
        .on("change", outputFilesChanged(source))
        .on("execution-cancel", () => announce("• Canceling build due to file changes"))
}

function deployOnFileChange({ socket, source })
{
    const parent = dirname(source);
    const match = `${source}{/**{/*,},}`;
    const execute = () => (rm(socket, true),
        fork("• Deploying blog.runkit.com... ",
            "../serve", ["--socket", socket, source]));
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
    console.log(concated);
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

