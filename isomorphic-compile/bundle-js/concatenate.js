
const { dirname } = require("path");
const { existsSync, readFileSync, appendFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;


module.exports = function concatenate({ destination, entrypoint, children })
{
    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const format = { "string": "utf-8" };
    const append = content =>
        appendFileSync(destination, content, format[typeof content]);

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

        if (metadata.entrypoints)
            for (const entrypoint of metadata.entrypoints)
                entrypoints.add(entrypoint);
    }

    append("],");
    append(JSON.stringify(modules));
    append(",");
    append(JSON.stringify(entrypoint));
    append(")");

    return { entrypoints };
}

function getChecksum(contents)
{
    return require("crypto")
        .createHash("sha512")
        .update(contents)
        .digest("hex");
}
