
module.exports = deserializePureMap;

var deserializeGenericMap = require("./generic-map");

function deserializePureMap(aDeserializedMap, serializedMap, context, fromObjectSerialization)
{
    // Just leverage the generic map deserialization.
    return deserializeGenericMap(aDeserializedMap, serializedMap, context, fromObjectSerialization, true);
}
