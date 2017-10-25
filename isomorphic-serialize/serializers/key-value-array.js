
function serializeKeyValueArray(anArray, aContext, toObjectSerialization)
{
    var keys = Object.keys(anArray);
    var count = keys.length;

    var serializedArray = [];

    for(var i = 0; i < count; i += 2)
    {
        var key = keys[i];
        var value = anArray[key];

        var canInlineKey = typeof key === "string";

        var serializedKey = toObjectSerialization(key, aContext, key, canInlineKey);
        var serializedValue = toObjectSerialization(value, aContext);

        serializedArray.push(serializedKey, serializedValue);
    }

    return serializedArray;
}

module.exports = serializeKeyValueArray;
