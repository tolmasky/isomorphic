
module.exports = deserializePureSet;

var deserializeGenericSet = require("./generic-set");

function deserializePureSet(aDeserializedSet, serializedSet, context, fromObjectSerialization)
{
    var modified = [].concat(serializedSet);
    // Insert the number of generic-object pairs (which is zero).
    modified.splice(1, 0, 0);

    // Just leverage the generic map deserialization.
    return deserializeGenericSet(aDeserializedSet, modified, context, fromObjectSerialization);
}
