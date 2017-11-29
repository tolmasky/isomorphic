
var invoker = require("../utils").invoker;
var deserializeKeyValuePairs = require("./generic-key-value-pairs");

module.exports = deserializeGenericSet;

// This will deserialize every set.
function deserializeGenericSet(aDeserializedSet, serializedSet, context, fromObjectSerialization, skipObjectPairs)
{
    var add = invoker("add");

    // index 0 is the type.
    var numberOfGenericObjectPairs = skipObjectPairs ? 0 : serializedSet[1];

    // First key starts at index 2.
    var firstIndex = skipObjectPairs ? 1 : 2;
    var endOfGenericPairs = numberOfGenericObjectPairs * 2 + firstIndex;
    var count = serializedSet.length;

    deserializeKeyValuePairs(serializedSet, aDeserializedSet, firstIndex, endOfGenericPairs, context, false, fromObjectSerialization);

    for (var index = endOfGenericPairs; index < count; index++)
    {
        var serializedValue = serializedSet[index];
        var value = fromObjectSerialization(serializedValue, context);
        add(value, aDeserializedSet);
    }

    return aDeserializedSet;
}
