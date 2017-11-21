
var deserializeKeyValuePairs = require("./generic-key-value-pairs");

module.exports = deserializeGenericMap;

// This will deserialize every map.
function deserializeGenericMap(aDeserializedMap, serializedMap, context, fromObjectSerialization, skipObjectPairs)
{
    // index 0 is the type.
    var numberOfGenericObjectPairs = skipObjectPairs ? 0 : serializedMap[1];

    // First key starts at index 2.
    var firstIndex = skipObjectPairs ? 1 : 2;
    var endOfKeyValuePairs = numberOfGenericObjectPairs * 2 + firstIndex;
    var count = serializedMap.length;

    // First deserialize all the keys directly on the object.
    deserializeKeyValuePairs(serializedMap, aDeserializedMap, firstIndex, endOfKeyValuePairs, context, false, fromObjectSerialization);
    // Now deserialize the pure map.
    deserializeKeyValuePairs(serializedMap, aDeserializedMap, endOfKeyValuePairs, count, context, "set", fromObjectSerialization);

    return aDeserializedMap;

}
