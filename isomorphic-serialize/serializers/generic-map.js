
var serializePureMap = require("./pure-map");
var serializeGenericObject = require("./generic-object");

var Call = (Function.prototype.call).bind(Function.prototype.call);
var Apply = (Function.prototype.call).bind(Function.prototype.apply);
var ArrayPush = Array.prototype.push;

module.exports = serializedGenericMap;

function serializedGenericMap(serializedMap, aMap, aContext, toObjectSerialization)
{
    var genericObjectSerialized = serializeGenericObject([], aMap, aContext, toObjectSerialization);
    var pureMapSerialized = serializePureMap([], aMap, aContext, toObjectSerialization);

    // Prefix with the number of pairs in the pure-map.
    Call(ArrayPush, serializedMap, genericObjectSerialized.length / 2);
    Apply(ArrayPush, serializedMap, genericObjectSerialized);
    Apply(ArrayPush, serializedMap, pureMapSerialized);

    return serializedMap;
}
