var ObjectKeys = Object.keys;

function serializeObject(aSerializedObject, anObject, aContext, toObjectSerialization)
{
    var keys = ObjectKeys(anObject);
    var count = keys.length;
    var index = 0;

    for (; index < count; index++)
    {
        var key = keys[index];
        var object = anObject[key];

        var serializedValue = toObjectSerialization(object, aContext);
        var serializedKey = toObjectSerialization(key, aContext, key, true);

        // FIXME: this can be faster with direct assign.
        aSerializedObject.push(serializedKey, serializedValue);
    }

    return aSerializedObject;
}

module.exports = serializeObject;
