
module.exports = function deserializeKeyValuePairs(from, to, index, stop, context, setMethod, fromObjectSerialization)
{
    while (index < stop)
    {
        var key = fromObjectSerialization(from[index++], context);
        var value = fromObjectSerialization(from[index++], context);

        if (setMethod)
            to[setMethod](key, value);
        else
            to[key] = value;
    }

    return to;
}
