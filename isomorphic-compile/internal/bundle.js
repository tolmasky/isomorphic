
const { existsSync, readFileSync, appendFileSync, unlinkSync } = require("fs");

const entrypoint = require("./entrypoint");


module.exports = function bundle({ path, destination, cache, options })
{
    return  <concatenate path = { path } destination = { destination } >
                <entrypoint { ...{ path, cache, options } } />
            </concatenate>
}

function concatenate({ destination, path, children })
{
    if (existsSync(destination))
        unlinkSync(destination);

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
    append(JSON.stringify(path));
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
