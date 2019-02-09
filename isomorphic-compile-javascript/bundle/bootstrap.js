(function (entrypoint, files, compilations)
{
    global.process = { env: { NODE_ENV:"development" } };

    function cachedRequire(index)
    {
        const module = Module._cache[index] || new Module(index);

        return module.exports;
    }

    function Module(index)
    {
        Module._cache[index] = this;

        const file = files[index];
        const filename = file[0];

        console.log("INSTANTIATING " + file[0]);

        const precompiled = compilations[file[1]];
        const references = file[2];

        this.exports = { };
        this.__dirname = filename.split("/").slice(0, -1).join("/");
        this.__filename = filename;
        this.require = function require(index)
        {
            if (typeof index !== "number")
                throw TypeError("Expected index require");

            const reference = references[index];

            if (typeof reference !== "number")
                throw TypeError("Could not find file referenced at " + index);

            return cachedRequire(reference);
        }

        precompiled.call(
            this.exports, /*this*/
            this.exports,
            this.require,
            this,
            this.__filename,
            this.__dirname);
    }

    Module._cache = { };

    cachedRequire(entrypoint);
})
