const { spawn } = require("child_process");

const buildOnFileChange = require("@isomorphic/build-on-file-change");

const style = require("chalk").bgBlue.white.bold;
const announce = message => console.log(style(message));

const uuid = require("uuid");

const express = require("express");
const http = require("http");
process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error.stack);
});

module.exports = function watch({ source, destination, port })
{
    const match = `${source}/!(_site|_cache)(*|**)`;
    const socketPath = `/tmp/${uuid.v4()}`;
    
    const build = () => fork("• Building blog.runkit.com... ",
        "../petrified-cli", ["--dev", source]);
    const deploy = () => fork("• Starting blog.runkit.com... ",
        "../serve", ["--serve", "--socket", socketPath, source + "/_site"]);

    buildOnFileChange({ source, match, build, deploy });

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
        })
        .listen(8080, () => console.log("LISTENING"));
}

function fork(message, path, args)
{
    announce(message);

    return spawn("node", [require.resolve(path), ...args], { stdio: [0, 1, 2] });
}
