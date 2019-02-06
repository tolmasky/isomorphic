const { internalModuleStat: mstat } = process.binding("fs");
const tstat = path => ({ "-1":false, 0:"file", 1:"directory" }[mstat(path)]);
const tstatCache = Object.create(null);


module.exports = function tstatCached(path)
{
    const cached = tstatCached[path];

    return cached === void(0) ? (tstatCached[path] = tstat(path)) : cached;
}
