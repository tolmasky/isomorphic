
module.exports = serializedPureMap;

function serializedPureMap(aMap, aContext, toObjectSerialization)
{
    var serializedObject = [];

    var keys = aMap.keys();

    for (var aKey of keys)
    {
        var value = aMap.get(aKey);

        var serializedKey = toObjectSerialization(aKey, aContext);
        var serializedValue = toObjectSerialization(value, aContext);

        serializedObject.push(serializedKey, serializedValue);
    }

    return serializedObject;
}
