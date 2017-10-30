
const invoker = require("../utils").invoker;

module.exports = deserializeGenericSet;

// This will deserialize every set.
function deserializeGenericSet(aDeserializedSet, serializedSet, context, fromObjectSerialization)
{
    var add = invoker("add");

    // index 0 is the type.
    var numberOfGenericObjectPairs = serializedSet[1];

    // First key starts at index 2.
    var firstIndex = 2;
    var index = firstIndex;
    var count = serializedSet.length;

    for (; index < count; index++)
    {
        if (index < numberOfGenericObjectPairs * 2 + firstIndex)
        {
            var serializedKey = serializedSet[index];
            var serializedValue = serializedSet[++index];

            var key = fromObjectSerialization(serializedKey, context);
            var value = fromObjectSerialization(serializedValue, context);

            aDeserializedSet[key] = value;
            continue;
        }
        else
        {
            var serializedValue = serializedSet[index];
            var value = fromObjectSerialization(serializedValue, context);
            add(value, aDeserializedSet);
        }
    }

    return aDeserializedSet;
}
