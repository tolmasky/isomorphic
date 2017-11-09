
const { dirname, extname, relative, isAbsolute } = require("path");
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const uglify = require("uglify-js");
const modulePreamble = "function (exports, require, module, __filename, __dirname) {\n";
const modulePostamble = "\n}";
const MUIDStore = require("./muid-store");
const hasOwnProperty = Object.prototype.hasOwnProperty;


module.exports = function concatenate({ root, destination, entrypoint, children, options })
{
    if (existsSync(destination))
        unlinkSync(destination);

    mkdirp(dirname(destination));

    const output = { buffers:[], length:0 };
    const hydrate = children[1].hydrate; // FIXME!!!

    const count = children.length;
    const { fs, mount } = fsAndMount();
    const modules = new MUIDStore(module => module.checksum);

    for (var index = 1; index < count; ++index)
    {
        const { path, include, assets, entrypoints } = children[index];
        const module = new Module(derooted(path), include);

        mount(modules.for(module), module.path);
        Array.from(assets || [], path => mount(-1, derooted(path)));
        Array.from(entrypoints || [], path => mount(-1, derooted(path)));

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
//console.log(JSON.stringify(fs, null, 2));
    append("],");
    append(JSON.stringify(fs, null, 2));
    append(",");

    if (hydrate)
        append(JSON.stringify("/node_modules/isomorphic/internal/hydrate.js"));
    else
        append(JSON.stringify(derooted(entrypoint)));

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
    
    function derooted(path)
    {
        return isAbsolute(path) ? "/" + relative(root, path) : path
    }
}

function Module(path, include)
{
    this.contents = readFileSync(include);
    this.checksum = getChecksum(this.contents);
    this.path = path;
    this.json = extname(path) === ".json";
}

function fsAndMount()
{
    const fs = { };
    const mount = (muid, path) =>
        path.reduce((parent, component, index) =>
            index === path.length - 1 ?
                store(parent, component, muid) :
                parent[component] || (parent[component] = { }), fs);

    return { fs, mount: (muid, path) => mount(muid, path.split("/")) };
    
    function store(parent, component, muid)
    {
        if (muid !== -1 || !hasOwnProperty.call(parent, component))
            parent[component] = muid;
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



