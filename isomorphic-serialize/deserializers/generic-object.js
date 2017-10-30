
var invoker = require("../utils").invoker;

// FIXME: this could easily change, then we should just go back to I.Map.isMap()
var IS_MAP_SENTINEL = "@@__IMMUTABLE_MAP__@@";

var immutableSet = invoker("set");

module.exports = deserializeGenericObject;

function deserializeGenericObject(aDeserializedObject, serializedObject, context, fromObjectSerialization)
{
    var forceImmutable = context.options.immutable;

    // index 0 is the type, all other values are deseriailzed and inserted into the
    // deserialized array in their current order.
    var keyIndex = 1;
    var count = serializedObject.length;

    for (; keyIndex < count; keyIndex += 2)
    {
        var key = fromObjectSerialization(serializedObject[keyIndex], context);
        var value = fromObjectSerialization(serializedObject[keyIndex + 1], context);

        if (forceImmutable || !!aDeserializedObject[IS_MAP_SENTINEL])
            immutableSet(key, value, aDeserializedObject);
        else
            aDeserializedObject[key] = value;
    }

    return aDeserializedObject;
}
