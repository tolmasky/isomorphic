var ObjectKeys = Object.keys;

function serializeObject(aSerializedObject, anObject, aContext, toObjectSerialization)
{
    var keys = ObjectKeys(anObject);
    var count = keys.length;
    var index = 0;
    var insetionIndex = aSerializedObject.length;

    for (; index < count; index++)
    {
        var key = keys[index];
        var object = anObject[key];

        var serializedValue = toObjectSerialization(object, aContext);
        var serializedKey = toObjectSerialization(key, aContext, key, true);

        aSerializedObject[insetionIndex++] = serializedKey;
        aSerializedObject[insetionIndex++] = serializedValue;
    }

    return aSerializedObject;
}

module.exports = serializeObject;
