var ObjectKeys = Object.keys;

function serializeObject(anObject, aContext, toObjectSerialization)
{
    var serializedObject = [];

    var keys = ObjectKeys(anObject);
    var count = keys.length;
    var index = 0;

    for (; index < count; index++)
    {
        var key = keys[index];
        var object = anObject[key];

        var serializedValue = toObjectSerialization(object, aContext);
        var serializedKey = toObjectSerialization(key, aContext);

        serializedObject.push(serializedKey, serializedValue);
    }

    return serializedObject;
}

module.exports = serializeObject;
