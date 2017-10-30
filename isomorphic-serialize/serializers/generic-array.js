
module.exports = serializeGenericArray;

function serializeGenericArray(serializedArray, anArray, aContext, toObjectSerialization)
{
    var keys = splitKeys(Object.keys(anArray));
    var indexRanges = keys[0];
    var nonIndexKeys = keys[1];

    indexRanges.forEach(function(aRange)
    {
        var startIndex = aRange.start;
        var count = aRange.count;
        serializedArray.push(startIndex, count);

        for (var i = startIndex; i < startIndex + count; i++)
        {
            var value = anArray[i];
            serializedArray.push(toObjectSerialization(value, aContext));
        }
    });

    if (nonIndexKeys.length)
        serializedArray.push(-1);

    for (var i = 0; i < nonIndexKeys.length; i++)
    {
        var key = nonIndexKeys[i];
        var value = anArray[key];

        var serializedKey = toObjectSerialization(key, aContext, key, true);
        var serializedValue = toObjectSerialization(value, aContext);

        serializedArray.push(serializedKey, serializedValue);
    }

    return serializedArray;
}

function splitKeys(keys)
{
    var indexKeys = [];
    var nonIndexKeys = [];

    keys.forEach(function(aKey)
    {
        var cooerced = +aKey;
        if (isNaN(cooerced))
            nonIndexKeys.push(aKey);
        else
            indexKeys.push(cooerced);
    });

    return [generateRanges(indexKeys.sort()), nonIndexKeys];
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
            ranges.push(newRange);
            newRange = { start: nextIndex, count: 1 };
        }
    }

    ranges.push(newRange);

    return ranges;
}
