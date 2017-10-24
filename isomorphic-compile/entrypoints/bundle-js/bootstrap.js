(function (content, modules, entrypoint)
{
var hasOwnProperty = Object.prototype.hasOwnProperty;
var requireDepth = 0;

function Module(id, parent)
{
    this.id = id;
    this.exports = {};
    this.parent = parent;
    updateChildren(parent, this, false);
    this.filename = null;
    this.loaded = false;
    this.children = [];
}

Module.prototype.load = function(filename)
{
    this.filename = filename;

    if (!hasOwnProperty.call(modules, filename))
        throw new Error("Module not found: " + filename);

    var components = filename.split("/");
    var dirname = components.slice(0, components.length - 1).join("/");
    var dependencies = modules[filename][1];
    var require = makeRequireFunction(this, dependencies);
    var precompiled = content[modules[filename][0]];

    precompiled(this.exports, require, this, filename, dirname);

    this.loaded = true;
};

function makeRequireFunction(module, dependencies)
{
    function require(path)
    {
        try
        {
            requireDepth += 1;

            if (!hasOwnProperty.call(dependencies, path))
                throw new Error("Module not found: " + path);

            return module.require(dependencies[path]);
        }
        finally
        {
            requireDepth -= 1;
        }
    }

    function resolve(request)
    {
        if (!hasOwnProperty.call(dependencies, request))
            throw new Error("Module not found: " + request);

        return dependencies[request];
    }

    require.resolve = resolve;

    return require;
}

Module._cache = Object.create(null);

function updateChildren(parent, child, scan)
{
    var children = parent && parent.children;
    if (children && !(scan && children.indexOf(child) >= 0))
        children.push(child);
}

Module.prototype.require = function(path)
{
    return Module._load(path, this, /* isMain */ false);
};

Module._load = function(path, parent, isMain)
{
    var filename = path;
    var cachedModule = Module._cache[filename];

    if (cachedModule)
    {
        updateChildren(parent, cachedModule, true);
        return cachedModule.exports;
    }

    // Don't call updateChildren(), Module constructor already does.
    var module = new Module(filename, parent);

/*    if (isMain)
    {
        process.mainModule = module;
        module.id = '.';
    }*/

    Module._cache[filename] = module;

    tryModuleLoad(module, filename);

    return module.exports;
};

function tryModuleLoad(module, filename)
{
    var threw = true;
    try
    {
        module.load(filename);
        threw = false;
    }
    finally
    {
        if (threw)
          delete Module._cache[filename];
    }
};

Module._load(entrypoint, null, false);
})