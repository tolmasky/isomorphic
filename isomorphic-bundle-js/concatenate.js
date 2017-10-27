
const { dirname, extname } = require("path");
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const transform = require("isomorphic-compile/babel-transform");
const uglify = require("uglify-js");
const modulePreamble = "function (exports, require, module, __filename, __dirname) {\n";
const modulePostamble = "\n}";



module.exports = function concatenate({ destination, entrypoint, children, options })
{
    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const output = { buffers:[], length:0 };

    // The first item is always the bootstrap file, it doesn't get wrapped.
    append(readFileSync(children[0].include));
    append("(window, [");

    const count = children.length;
    const modules = { };
    const content = { references: { }, count: 0 };
    const entrypoints = new Set();

    for (var index = 1; index < count; ++index)
    {
        const metadata = children[index];
        const contents = readFileSync(metadata.include);
        const checksum = getChecksum(contents);
        const { path, dependencies } = metadata;

        if (!hasOwnProperty.call(content.references, checksum))
        {
            content.references[checksum] = content.count++;

            if (content.count > 1)
                append(",");

            const isJSON = extname(path) ===".json";
            
            if (!isJSON)
                append(modulePreamble);
 
            append(contents);
 
            if (!isJSON)
                append(modulePostamble);
        }

        const reference = content.references[checksum];

        modules[path] = [reference, dependencies];
    }

    append("],");
    append(JSON.stringify(modules));
    append(",");
    append(JSON.stringify(entrypoint));
    append(")");

    const concated = Buffer.concat(output.buffers, output.length);
    const minified = minify(options.minify, concated.toString("utf-8"));

    writeFileSync(destination, minified, "utf-8");

    return children;

    function append(content)
    {
        if (typeof content === "string")
            return append(Buffer.from(content, "utf-8"));

        output.buffers.push(content);
        output.length += content.length;
    }
}

function minify(proceed, input)
{
    if (!proceed)
        return input;

    const { code, error } = uglify.minify(input);

    if (error)
        throw error;

    return code;
}

function getChecksum(contents)
{
    return require("crypto")
        .createHash("sha512")
        .update(contents)
        .digest("hex");
}
