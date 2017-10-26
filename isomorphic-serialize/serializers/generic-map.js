
var serializePureMap = require("./pure-map");
var serializeGenericObject = require("./generic-object");

module.exports = serializedGenericMap;

function serializedGenericMap(aMap, aContext, toObjectSerialization)
{
    var genericObjectSerialized = serializeGenericObject(aMap, aContext, toObjectSerialization);
    var pureMapSerialized = serializePureMap(aMap, aContext, toObjectSerialization);

    // Prefix with the number of pairs in the pure-map.
    return [genericObjectSerialized.length / 2].concat(genericObjectSerialized, pureMapSerialized);
}
