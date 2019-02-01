const { dirname, extname, relative, isAbsolute } = require("path");
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const JSONPreamble = "function(module) { module.exports = ";
const JSONPostamble = "\n}";
const MUIDStore = require("./muid-store");
const hasOwnProperty = Object.prototype.hasOwnProperty;
const bootstrapPath = require.resolve("./bootstrap");


module.exports = function concatenate({ bundle, root, destination })
{
    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const output = { buffers:[], length:0 };
    const { entrypoint, compilations } = bundle;

    // The first item is always the bootstrap file, it doesn't get wrapped.
    append("(function (global) {");
    append(readFileSync(bootstrapPath));
    append("(");
    append(entrypoint + ",");

    const files = bundle.files
        .map(({ filename, outputIndex, dependencies }) =>
            [filename, outputIndex, dependencies]);

    append(JSON.stringify(files));
    append(", [");

    for (const output of bundle.outputs)
    {
        const isJSON = extname(output) === ".json";

        if (isJSON)
            append(JSONPreamble);

        append(readFileSync(output));

        if (isJSON)
            append(JSONPostamble);

        append(",");
    }

    append("]) })(window)");

    const concated = Buffer.concat(output.buffers, output.length);

    writeFileSync(destination, concated);

//    return children;

    function append(content)
    {
        if (typeof content === "string")
            return append(Buffer.from(content, "utf-8"));

        output.buffers.push(content);
        output.length += content.length;
    }
    
    function derooted(path)
    {
        return isAbsolute(path) ? "/" + relative(root, path) : path
    }
}

