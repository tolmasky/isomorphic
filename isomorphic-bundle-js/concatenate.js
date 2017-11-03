
const { dirname, extname, relative } = require("path");
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const transform = require("isomorphic-compile/babel-transform");
const uglify = require("uglify-js");
const modulePreamble = "function (exports, require, module, __filename, __dirname) {\n";
const modulePostamble = "\n}";
const MUIDStore = require("./muid-store");


module.exports = function concatenate({ root, destination, entrypoint, children, options })
{
    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const output = { buffers:[], length:0 };

    // The first item is always the bootstrap file, it doesn't get wrapped.
    append(readFileSync(children[0].include));
    append("(window, [");

    const count = children.length;
    const content = { references: { }, count: 0 };
    const entrypoints = new Set();
    const modules = new MUIDStore(([path]) => path);

    for (var index = 1; index < count; ++index)
    {
        const metadata = children[index];
        const contents = readFileSync(metadata.include);
        const checksum = getChecksum(contents);
        const { path, dependencies } = metadata;
        const rooted = "~/" + relative(root, path);

        if (!hasOwnProperty.call(content.references, checksum))
        {
            content.references[checksum] = content.count++;

            if (content.count > 1)
                append(",");

            const isJSON = extname(rooted) ===".json";

            if (!isJSON)
                append(modulePreamble);
 
            append(contents);
 
            if (!isJSON)
                append(modulePostamble);
        }

        const contentReference = content.references[checksum];
        const dependenciesMUIDs = ObjectMap(dependencies,
            path => modules.future("~/" + relative(root, path)));

        modules.for([rooted, contentReference, dependenciesMUIDs]);
    }
//writeFileSync(destination+"just_module.txt", JSON.stringify(modules.finalize()), "utf-8");
    append("],");
    append(JSON.stringify(modules.finalize()));
    append(",");
    append(JSON.stringify("~/" + relative(root, entrypoint)));
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

function ObjectMap(anObject, aFunction)
{
    const mapped = { };

    for (const key of Object.keys(anObject))
        mapped[key] = aFunction(anObject[key], key);

    return mapped;
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



