const builtIns = ((builtIns, empty) =>
    (Object.keys(builtIns)
        .filter(key => !builtIns[key])
        .map(key => builtIns[key] = empty), builtIns))
    (require("node-libs-browser"),
    require.resolve("node-libs-browser/mock/empty"));


module.exports = function polyfill(filename)
{
    return builtIns[filename] || false;
}
