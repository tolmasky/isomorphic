
module.exports = deserializePureSet;

var deserializeGenericSet = require("./generic-set");

function deserializePureSet(aDeserializedSet, serializedSet, context, fromObjectSerialization)
{
    // Just leverage the generic map deserialization.
    return deserializeGenericSet(aDeserializedSet, serializedSet, context, fromObjectSerialization, true);
}
