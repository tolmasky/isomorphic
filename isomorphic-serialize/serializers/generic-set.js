
var serializePureSet = require("./pure-set");
var serializeGenericObject = require("./generic-object");

var Call = (Function.prototype.call).bind(Function.prototype.call);
var Apply = (Function.prototype.call).bind(Function.prototype.apply);
var ArrayPush = Array.prototype.push;

module.exports = serializedGenericSet;

function serializedGenericSet(aSerializedSet, aSet, aContext, toObjectSerialization)
{
    var genericObjectSerialized = serializeGenericObject([], aSet, aContext, toObjectSerialization);
    var pureSetSerialized = serializePureSet([], aSet, aContext, toObjectSerialization);

    // Prefix with the number of items in the pure-set.
    Call(ArrayPush, aSerializedSet, genericObjectSerialized.length / 2);
    Apply(ArrayPush, aSerializedSet, genericObjectSerialized);
    Apply(ArrayPush, aSerializedSet, pureSetSerialized);

    return aSerializedSet;
}
