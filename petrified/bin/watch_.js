const execOnFileChange = require("./files-changed/files-watcher-2");
const { spawn } = require("child_process");

const style = require("chalk").bgBlue.white.bold;
const announce = message => console.log(style(message));

const uuid = require("uuid");

const express = require("express");
const http = require("http");


module.exports = function watch({ source, port, completed })
{
    const match = `${source}/!(_cache|_site)**/*`;
    const socketPath = `/tmp/${uuid.v4()}`;

    execOnFileChange({ source, match, execute: execute(source, socketPath) })
        .on("files-changed", filesChanged(source))
        .on("execution-cancel", () => announce("• Canceling build due to file changes"))
        .on("executing-complete", () => completed());
console.log("hello?");
    express()
        .get("*", function (request, response, next)
        {
            const { method, headers, originalUrl: path } = request;
            const options = { socketPath, headers, method, path };
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

            proxied.end();

            
            

            //proxied.pipe(request);
            //console.log(proxied);
//            response.pipe(request(request.url));
        })
        .listen(8080, () => console.log("LISTENING"));
}

function execute(source, socket)
{
    return function ()
    {
        announce("• Building blog.runkit.com... ");

        const args = [
            require.resolve("./petrified-cli"),
            "--dev",
            "--serve",
            "--socket", socket,
            source
        ];

        return spawn("node", args, { stdio: [0, 1, 2] });
    }
}

function filesChanged(source, changes)
{
    if (arguments.length === 1)
        return changes => filesChanged(source, changes);

    console.log("• Detected file changes...");

    const expanded = changes.length > 15 ? 10 : 15;

    const head = changes.slice(0, expanded);
    const rest = Math.max(changes.length - expanded, 0);

    const files = changes.map(({ path, action }) =>
        `  - ${path.substr(source.length)} was ${action}.`).join("\n") +
        (rest > 0 ? "\n  - and ${head.length - limit} more..." : "");

    console.log(files);
}
