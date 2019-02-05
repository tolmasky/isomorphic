
module.exports = function JSONCached(f)
{
    const cache = Object.create(null);

    return function (...args)
    {
        const key = JSON.stringify(args);

        return cache[key] || (cache[key] = f(...args));
    }
}
