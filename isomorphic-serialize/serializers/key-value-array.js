
function serializeKeyValueArray(aSerializedArray, anArray, aContext, toObjectSerialization)
{
    var keys = Object.keys(anArray);
    var count = keys.length;

    for(var i = 0; i < count; i += 2)
    {
        var key = keys[i];
        var value = anArray[key];

        var canInlineKey = typeof key === "string";

        var serializedKey = toObjectSerialization(key, aContext, key, canInlineKey);
        var serializedValue = toObjectSerialization(value, aContext);

        // FIXME: this can be faster with direct assign.
        aSerializedArray.push(serializedKey, serializedValue);
    }

    return aSerializedArray;
}

module.exports = serializeKeyValueArray;
