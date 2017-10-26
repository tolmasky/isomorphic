
const { dirname } = require("path");
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const { minify } = require("uglify-js");


module.exports = function concatenate({ destination, entrypoint, children })
{
    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const output = { buffers:[], length:0 };

    append(readFileSync(require.resolve("./bootstrap")));
    append("([");

    const count = children.length;
    const modules = { };
    const content = { references: { }, count: 0 };
    const entrypoints = new Set();

    for (var index = 0; index < count; ++index)
    {
        const metadata = children[index];
        const contents = readFileSync(metadata.include);
        const checksum = getChecksum(contents);

        if (!hasOwnProperty.call(content.references, checksum))
        {
            content.references[checksum] = content.count++;

            if (content.count > 1)
                append(",");

            append("function (exports, require, module, __filename, __dirname) {");
            append(contents);
            append("}");
        }

        const reference = content.references[checksum];
        const { path, dependencies } = metadata;

        modules[path] = [reference, dependencies];
    }

    append("],");
    append(JSON.stringify(modules));
    append(",");
    append(JSON.stringify(entrypoint));
    append(")");

    const original = Buffer.concat(output.buffers, output.length);
    const { code: minified } = minify(original.toString("utf-8"));

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

function getChecksum(contents)
{
    return require("crypto")
        .createHash("sha512")
        .update(contents)
        .digest("hex");
}
