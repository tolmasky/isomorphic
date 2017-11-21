
async function map(fn, object)
{
    return mapAccum((accum, value, key) =>
        [accum, fn(value, key)], null, object);
}

module.exports = map;
module.exports.map = map;

async function mapAccum(fn, accum, object)
{
    const result = { };

    for (const key of Object.keys(object))
        [accum, result[key]] = await fn(accum, object[key], key);

    return [accum, result];
}

module.exports.accum = mapAccum;

