const http = require("http");
const { read } = require("sf-fs");

const injectedScriptContent = read(require.resolve("./injected-script"), "utf-8");
const injectedScriptFragment = `<script>${injectedScriptContent}</script>`;
const injectedScriptFragmentLength = injectedScriptFragment.length;


module.exports = function injectionProxy({ proxiedSocketPath, port })
{
    return (request, response, next) =>
        forwardRequest(proxiedSocketPath, request, response, next);
}

function forwardRequest(socketPath, incomingRequest, outgoingResponse, next)
{
    const { method, headers, originalUrl: path } = incomingRequest;
    const options = { socketPath, headers, method, path };
    const outgoingRequest = http.request(options, incomingResponse => 
        injectReloadScript(incomingResponse, outgoingResponse));

    outgoingRequest.on("error", function (error)
    {
        if (error.code === "ENOENT" && error.address === socketPath)
            return outgoingResponse.status(503).send("Still Building");

        next(error);
    });

    incomingRequest.pipe(outgoingRequest);
}

function injectReloadScript(incomingResponse, outgoingResponse)
{
    const { statusCode, headers } = incomingResponse;
    const contentType = headers["content-type"] || "";

    if (!contentType.startsWith("text/html;"))
    {
        outgoingResponse.writeHead(statusCode, headers);
        
        return incomingResponse.pipe(outgoingResponse);
    }
console.log("HERE!!!");
    const contentLength = headers["content-length"];
    const outgoingContentLength = contentLength + injectedScriptFragmentLength;
    const outgoingHeaders = { ...headers, "content-length": outgoingContentLength };
console.log(headers, outgoingHeaders);
    outgoingResponse.writeHead(statusCode, outgoingHeaders);
    incomingResponse.pipe(outgoingResponse, { end: false });

    incomingResponse.on("end", () => 
        outgoingResponse.end(injectedScriptFragment));
}
