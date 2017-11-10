
const invoker = require("../utils").invoker;
module.exports = deserializeKeyValueArray;

function deserializeKeyValueArray(aDeserializedArray, serializedArray, context, fromObjectSerialization)
{
    var forceImmutable = context.options.immutable;
    var set = forceImmutable ? invoker("set") : setValueForKey;

    // index 0 is the type, all other values are deseriailzed and inserted into the
    // deserialized array in their current order.
    var keyIndex = 1;
    var count = serializedArray.length;

    for (; keyIndex < count; keyIndex += 2)
    {
        var serialziedKey = serializedArray[keyIndex];
        var key = fromObjectSerialization(serialziedKey, context);

        var serializedValue = serializedArray[keyIndex + 1];
        var value = fromObjectSerialization(serializedValue, context);

        set(key, value, aDeserializedArray);
    }

    return aDeserializedArray;
}

function setValueForKey(aKey, anItem, anObject)
{
    anObject[aKey] = anItem;
}
