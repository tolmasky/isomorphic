
var serializePureSet = require("./pure-set");
var serializeGenericObject = require("./generic-object");

module.exports = serializedGenericSet;

function serializedGenericSet(aSet, aContext, toObjectSerialization)
{
    var genericObjectSerialized = serializeGenericObject(aSet, aContext, toObjectSerialization);
    var pureSetSerialized = serializePureSet(aSet, aContext, toObjectSerialization);

    // Prefix with the number of items in the pure-set.
    return [genericObjectSerialized.length / 2].concat(genericObjectSerialized, pureSetSerialized);
}
