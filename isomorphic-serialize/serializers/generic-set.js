
var serializePureSet = require("./pure-set");
var serializeGenericObject = require("./generic-object");

module.exports = serializedGenericSet;

function serializedGenericSet(aSerializedSet, aSet, aContext, toObjectSerialization)
{
    var pairLengthIndex = aSerializedSet.length;
    aSerializedSet[pairLengthIndex] = -1;

    serializeGenericObject(aSerializedSet, aSet, aContext, toObjectSerialization);

    var length = aSerializedSet.length - pairLengthIndex - 1;
    aSerializedSet[pairLengthIndex] = length / 2;

    return serializePureSet(aSerializedSet, aSet, aContext, toObjectSerialization);
}
