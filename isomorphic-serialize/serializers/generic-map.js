
var serializePureMap = require("./pure-map");
var serializeGenericObject = require("./generic-object");

module.exports = serializedGenericMap;

function serializedGenericMap(serializedMap, aMap, aContext, toObjectSerialization)
{
    var pairLengthIndex = serializedMap.length;
    serializedMap[pairLengthIndex] = -1;

    serializeGenericObject(serializedMap, aMap, aContext, toObjectSerialization);

    var length = serializedMap.length - pairLengthIndex - 1;
    serializedMap[pairLengthIndex] = length / 2;

    return serializePureMap(serializedMap, aMap, aContext, toObjectSerialization);
}
