module.exports = deserializeGenericObject;

function deserializeGenericObject(aDeserializedObject, serializedObject, context, fromObjectSerialization)
{
    // index 0 is the type, all other values are deseriailzed and inserted into the
    // deserialized array in their current order.

    // var forceImmutable = context.options.immutable;
    // var deserializedObjects = context.deserializedObjects;
    // var anObjectSerialization = context.anObjectSerialization;

    var keyIndex = 1;
    var count = serializedObject.length;

    for (; keyIndex < count; keyIndex += 2)
    {
        var key = fromObjectSerialization(keyIndex, context);
        var value = fromObjectSerialization(keyIndex + 1, context);

        set(key, value, aDeserializedObject);
    }
}

function set(aKey, aValue, anObject)
{
    anObject[aKey] = aValue;
}
