const { dirname, extname, relative, isAbsolute } = require("path");
const { existsSync, readFileSync, writeFileSync, unlinkSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`) && path;
const JSONPreamble = "function(){return";
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

    append("(function(){}");
    append(")(window, ")

    const files = bundle.files.valueSeq().map(([index]) =>
        [index, compilations.get(index)
            .metadata.dependencies
                .map(filename => bundle.files.get(filename)[1])]);

    append(JSON.stringify(files));
    append(", [");

    for (const compilation of compilations)
    {
        append(readFileSync(compilation.output));
        append(",");
    }

    append("])");
/*
    for (const file of compilations)
    {
        
    }

    

    const { fs, mount } = fsAndMount();
    const modules = new MUIDStore(module => module.checksum);

    compilations.map(function ({ output, checksum }, path)
    {
//        const { output, assets } = descendents.get(index);
        const module = new Module(derooted(path), output, checksum);

        mount(modules.for(module), module.path);
//        Array.from(assets || [], path => mount(-1, derooted(path)));
//        Array.from(entrypoints || [], path => mount(-1, derooted(path)));
    });

    // The first item is always the bootstrap file, it doesn't get wrapped.
    append("(function (global) { (function (compiled, fs, entrypoint) {");
    append(readFileSync(bootstrapPath));
    append("} )([");

    for (const module of modules.finalize())
    {
        if (module.json)
            append(JSONPreamble);

        append(module.contents);

        if (module.json)
            append(JSONPostamble);

        append(",");
    }
//console.log(JSON.stringify(fs, null, 2));
    append("],");
    append(JSON.stringify(fs, null, 2));
    append(",");

//    if (hydrate)
//        append(JSON.stringify("/node_modules/isomorphic/internal/hydrate.js"));
//    else
        append(JSON.stringify(derooted(entrypoint)));

    append(") } )(window)");
*/
    const concated = Buffer.concat(output.buffers, output.length);
console.log(destination);
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

function Module(path, include, checksum)
{
    this.contents = readFileSync(include);
    this.checksum = checksum;
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

function getChecksum(contents)
{
    return require("crypto")
        .createHash("sha512")
        .update(contents)
        .digest("hex");
}


