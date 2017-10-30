
module.exports = serializedPureMap;

function serializedPureMap(aSerializedMap, aMap, aContext, toObjectSerialization)
{
    var keys = aMap.keys();

    for (var aKey of keys)
    {
        var value = aMap.get(aKey);

        var serializedKey = toObjectSerialization(aKey, aContext);
        var serializedValue = toObjectSerialization(value, aContext);

        aSerializedMap.push(serializedKey, serializedValue);
    }

    return aSerializedMap;
}
