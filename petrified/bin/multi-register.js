var transformFileSync = require("babel-core").transformFileSync;
var fs = require("fs");
var Module = require("module");


module.exports = function (options)
{
    var normalized = options.map(function (options)
    {
        const rest = Object.assign({ }, options);
        
        delete rest.match;

        return [options.match || function () { return false }, rest];
    });

    const original = Module._extensions[".js"];
    
    Module._extensions[".js"] = function (module, filename)
    {
        var found = normalized.find(function (pair)
        {console.log(pair);
            return pair[0](filename)
        });

        if (!found)
            return original(module, filename);

        var options = Object.assign({ ast: false }, found[1]);
        var transformed = transformFileSync(filename, options).code;

        return module._compile(transformed, filename);
    }
}
