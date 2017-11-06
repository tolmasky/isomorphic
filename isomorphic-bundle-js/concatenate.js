
const { dirname, extname, relative, isAbsolute } = require("path");
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
    const hydrate = children[1].hydrate; // FIXME!!!

    const count = children.length;
    const fs = { };
    const modules = new MUIDStore(({ checksum }) => checksum);

    for (var index = 1; index < count; ++index)
    {
        const module = new Module(root, children[index]);
        const muid = modules.for(module);

        (function record(fs, path, index)
        {
            const component = path[index];

            if (index < path.length - 1)
                return record(fs[component] || (fs[component] = { }), path, index + 1);

            fs[component] = muid;
        })(fs, module.path.split("/"), 0);
    }
    
    // The first item is always the bootstrap file, it doesn't get wrapped.
    append("(function (global) { (function (compiled, fs, entrypoint) {");
    append(readFileSync(children[0].include));
    append("} )([");

    for (const module of modules.finalize())
    {
        append(modulePreamble);

        if (module.json)
            append("return ");

        append(module.contents);
        append(modulePostamble);
        append(",");
    }

    append("],");
    append(JSON.stringify(fs, null, 2));
    append(",");

    if (hydrate)
        append(JSON.stringify("/node_modules/isomorphic/internal/hydrate.js"));
    else
        append(JSON.stringify("/" + relative(root, entrypoint)));

    append(") } )(window)");

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

function Module(root, { path, include })
{
    this.contents = readFileSync(include);
    this.checksum = getChecksum(this.contents);
    this.path = isAbsolute(path) ? "/" + relative(root, path) : path;
    this.json = extname(path) === ".json";
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



