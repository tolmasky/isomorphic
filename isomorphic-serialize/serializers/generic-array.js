
var Call = (Function.prototype.call).bind(Function.prototype.call);

var ObjectKeys = Object.keys;
var ArrayPush = Array.prototype.push;
var ArrayForEach = Array.prototype.forEach;
var ArraySort = Array.prototype.sort;

module.exports = serializeGenericArray;

function serializeGenericArray(serializedArray, anArray, aContext, toObjectSerialization)
{
    var keys = splitKeys(ObjectKeys(anArray));
    var indexRanges = keys[0];
    var nonIndexKeys = keys[1];

    Call(ArrayForEach, indexRanges, function(aRange)
    {
        var startIndex = aRange.start;
        var count = aRange.count;
        Call(ArrayPush, serializedArray, startIndex, count);

        for (var i = startIndex; i < startIndex + count; i++)
        {
            var value = anArray[i];
            Call(ArrayPush, serializedArray, toObjectSerialization(value, aContext));
        }
    });

    if (nonIndexKeys.length)
        Call(ArrayPush, serializedArray, -1);

    for (var i = 0; i < nonIndexKeys.length; i++)
    {
        var key = nonIndexKeys[i];
        var value = anArray[key];

        var serializedKey = toObjectSerialization(key, aContext, key, true);
        var serializedValue = toObjectSerialization(value, aContext);

        Call(ArrayPush, serializedArray, serializedKey, serializedValue);
    }

    return serializedArray;
}

function splitKeys(keys)
{
    var indexKeys = [];
    var nonIndexKeys = [];

    Call(ArrayForEach, keys, function(aKey)
    {
        var cooerced = +aKey;
        if (cooerced !== cooerced) // NaN
            Call(ArrayPush, nonIndexKeys, aKey);
        else
            Call(ArrayPush, indexKeys, cooerced);
    });

    return [generateRanges(Call(ArraySort, indexKeys)), nonIndexKeys];
}

function generateRanges(indexes)
{
    // FIXME: handle empty indexes case.

    var ranges = [];

    if (!indexes.length)
        return;

    var startIndex = indexes[0];

    var newRange = { start: startIndex, count: 1 };

    for (var i = 1; i < indexes.length; i++)
    {
        var nextIndex = indexes[i];

        if (newRange.start + 1 === nextIndex)
            newRange.count++;
        else
        {
            Call(ArrayPush, ranges, newRange);
            newRange = { start: nextIndex, count: 1 };
        }
    }

    Call(ArrayPush, ranges, newRange);

    return ranges;
}
