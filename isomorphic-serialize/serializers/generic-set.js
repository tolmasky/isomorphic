
var serializePureSet = require("./pure-set");
var serializeGenericObject = require("./generic-object");

module.exports = serializedGenericSet;

function serializedGenericSet(aSerializedSet, aSet, aContext, toObjectSerialization)
{
    var genericObjectSerialized = serializeGenericObject([], aSet, aContext, toObjectSerialization);
    var pureSetSerialized = serializePureSet([], aSet, aContext, toObjectSerialization);

    // Prefix with the number of items in the pure-set.
    aSerializedSet.push(genericObjectSerialized.length / 2);
    aSerializedSet.push.apply(aSerializedSet, genericObjectSerialized);
    aSerializedSet.push.apply(aSerializedSet, pureSetSerialized);

    return aSerializedSet;
}
