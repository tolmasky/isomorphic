

const read = path => path.replace(/\/$/, "").split("/").reduce((fs, name) => fs[name], fs);
const onFail = (value, f) =>
    (...args) => { try { return f(...args) } catch (e) { return value } }
const natives = { "module": 1, "path": 1, "vm": 1, "fs": 1 };
const nativeCache = { };
const hasOwnProperty = Object.prototype.hasOwnProperty;

const shims =
{
    "native_module": { nonInternalExists: request => hasOwnProperty.call(natives, request), require },
    "assert": { "ok": (value, message) => { if (!value) throw new Error(message); } },
    "util": { deprecate(){}, debuglog: () => () => {} },
    "internal/url": {},
    "internal/loader/ModuleWrap": {},
    "internal/fs": {},
    "internal/module": { makeRequireFunction },
    "internal/errors": { },
    "internal/loader/Loader": { },
    "internal/loader/ModuleJob": { },
    "fs": { realpathSync: x => x },
    "vm": { }
};
const bindings =
{
    "config": { },
    "fs":
    {
        // FIXME: IE support slice with negative values?
        internalModuleReadFile: path =>
            path.split("/").slice(0, -1)
                .reduce((fs, name) => fs[name], fs)["/main-json"],
        internalModuleStat: onFail(-2, path =>
            ({ number: 1, object: 2 }[typeof read(path)] || -1) - 1)
    }
}

global.process =
{
    binding: name => bindings[name],
    env: { NODE_ENV: "production" },
    argv: ["node", entrypoint],
    execPath: "/",
    cwd: () => "/",
    _tickCallback: () => {}
};

const { dirname } = Object.assign(require("path"), { _makeLong: path => path });
const Module = require("module");


Module._extensions[".js"] =
Module._extensions[".json"] = function(module, filename)
{
    const index = read(filename);
    const precompiled = compiled[index];
    const require = makeRequireFunction(module);

    return precompiled(global, global.process)
        .call(module.exports,
            module.exports, require, module, filename, dirname(filename));
};

// Invoke with makeRequireFunction(module) where |module| is the Module object
// to use as the context for the require() function.
function makeRequireFunction(module)
{
    const { Module } = module.constructor;
    const { _extensions: extensions, _cache: cache } = Module;

    return Object.assign(function require(path)
    {
        try
        {
          return module.require(path);
        }
        finally { }
    }, { resolve, paths:[], main: process.mainModule, extensions, cache });

    function resolve(request, options)
    {
        return Module._resolveFilename(request, module, false, options);
    }
}

function require(request)
{
    if (hasOwnProperty.call(shims, request))
        return shims[request];

    if (hasOwnProperty.call(nativeCache, request))
        return nativeCache[request].exports;

    const index = fs[request];
    const precompiled = compiled[index](global, process);
    const module = { exports: { } };

    precompiled.call(module.exports, module.exports, require, module);

    nativeCache[request] = module;

    return module.exports;
}

Module.runMain();
