
var serializePureMap = require("./pure-map");
var serializeGenericObject = require("./generic-object");

module.exports = serializedGenericMap;

function serializedGenericMap(serializedMap, aMap, aContext, toObjectSerialization)
{
    var genericObjectSerialized = serializeGenericObject([], aMap, aContext, toObjectSerialization);
    var pureMapSerialized = serializePureMap([], aMap, aContext, toObjectSerialization);

    // Prefix with the number of pairs in the pure-map.
    serializedMap.push(genericObjectSerialized.length / 2);
    serializedMap.push.apply(serializedMap, genericObjectSerialized);
    serializedMap.push.apply(serializedMap, pureMapSerialized);

    return serializedMap;
}
