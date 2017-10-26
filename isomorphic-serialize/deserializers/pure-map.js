
module.exports = deserializePureMap;

var deserializeGenericMap = require("./generic-map");

function deserializePureMap(aDeserializedMap, serializedMap, context, fromObjectSerialization)
{
    var modified = [].concat(serializedMap);
    // Insert the number of generic-object pairs (which is zero).
    modified.splice(1, 0, 0);

    // Just leverage the generic map deserialization.
    return deserializeGenericMap(aDeserializedMap, modified, context, fromObjectSerialization);
}
