
const invoker = require("../utils").invoker;

module.exports = deserializeGenericMap;

// This will deserialize every map.
function deserializeGenericMap(aDeserializedMap, serializedMap, context, fromObjectSerialization)
{
    var set = invoker("set");

    // index 0 is the type.
    var numberOfGenericObjectPairs = serializedMap[1];

    // First key starts at index 2.
    var firstIndex = 2;
    var keyIndex = firstIndex;
    var count = serializedMap.length;

    // First deserialize all the keys directly on the object.
    deserializePairs(serializedMap, setValueForKey, numberOfGenericObjectPairs * 2 + firstIndex);
    // Now deserialize the pure map.
    deserializePairs(serializedMap, set, count);

    return aDeserializedMap;

    function deserializePairs(aSerializedMap, mutator, stopAfter)
    {
        for (; keyIndex < stopAfter; keyIndex += 2)
        {
            var key = fromObjectSerialization(serializedMap[keyIndex], context);
            var value = fromObjectSerialization(serializedMap[keyIndex + 1], context);

            mutator(key, value, aDeserializedMap);
        }
    }
}

function setValueForKey(aKey, aValue, anObject)
{
    anObject[aKey] = aValue;
}
