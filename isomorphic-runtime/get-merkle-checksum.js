
const crypto = require("crypto");
const toString = Function.prototype.toString;

const ChecksumSymbol = Symbol("checksum");
const CachedChecksums = new WeakMap();

const NativeRegExp = /^function [$A-Z_a-z][0-9A-Z_a-z$]*\(\) { \[native code\] }$/;

const { base, getArguments } = require("generic-jsx");

module.exports = getMerkleChecksum;

function getMerkleChecksum(value)
{
    if (value === null)
        return "value:null:null";

    const type = typeof value;

    if (type === "function")
        return getFunctionCallChecksum(value);

    if (type === "symbol")
        return "symbol:" + type + ":" + value.toString();

    if (type !== "object")
        return "value:" + type + ":" + value;

    if (value instanceof Set)
        return getSetChecksum(value);

    const cached = CachedChecksums.get(value);

    if (cached)
        return cached;

    const hash = crypto.createHash("sha512");
    const keys = Object.keys(value);
    const count = keys.length;
    const isArray = Array.isArray(value);

    hash.update(isArray ? "array:" : "object:");

    for (var index = 0; index < count; ++index)
    {
        const key = keys[index];

        hash.update("key:")
        hash.update(key);
        hash.update("value:")
        hash.update(getMerkleChecksum(value[key]));
    }

    const checksum = hash.digest("base64");

    CachedChecksums.set(value, checksum);

    return checksum;
}

function getSetChecksum(aSet)
{
    const hash = crypto.createHash("sha512");

    hash.update("set:");

    for (const item of aSet)
    {
        hash.update("item:")
        hash.update(getMerkleChecksum(item));
    }

    return hash.digest("base64");
}

const getFunctionCallChecksum = getCachedChecksum(function (aFunctionCall)
{
    return crypto.createHash("sha512")
        .update("function-call:")
        .update("base:" + getFunctionChecksum(base(aFunctionCall)))
        .update("arguments:" + getMerkleChecksum(getArguments(aFunctionCall)))
        .digest("base64");
});

const getFunctionChecksum = getCachedChecksum(function (aFunction)
{
    const source = toString.call(aFunction);

    if (NativeRegExp.test(source))
        throw Error(`Can't auto-generate checksum for ${aFunction.name}.`);

    return crypto.createHash("sha512")
        .update("function:")
        .update("name:" + aFunction.name)
        .update(aFunction.name)
        .update("source:" + source)
        .digest("base64");
});

function getCachedChecksum(getChecksum)
{
    return function (item)
    {
        if (item[ChecksumSymbol])
            return item[ChecksumSymbol];

        return item[ChecksumSymbol] = getChecksum(item);
    }
}
