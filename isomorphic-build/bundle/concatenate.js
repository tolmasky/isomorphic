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

    // The first item is always the bootstrap file, it doesn't get wrapped.
    append(readFileSync(bootstrapPath));
    append("(window, ")

    const files = bundle.files.valueSeq().map(([index]) =>
        [index, compilations.get(index)
            .metadata.dependencies
                .map(filename => bundle.files.get(filename)[1])]);

    append(JSON.stringify(files));
    append(", [");

    for (const { output } of compilations)
    {
        const isJSON = extname(output) === ".json";

        if (isJSON)
            append(JSONPreamble);

        append(readFileSync(output));

        if (isJSON)
            append(JSONPostamble);

        append(",");
    }

    append("])");

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


