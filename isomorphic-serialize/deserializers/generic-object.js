
var deserializeKeyValuePairs = require("./generic-key-value-pairs");
// FIXME: this could easily change, then we should just go back to I.Map.isMap()
var IS_MAP_SENTINEL = "@@__IMMUTABLE_MAP__@@";

module.exports = deserializeGenericObject;

function deserializeGenericObject(aDeserializedObject, serializedObject, context, fromObjectSerialization)
{
    var setterMethod = (context.options.immutable || !!aDeserializedObject[IS_MAP_SENTINEL]) && "set";
    var startIndex = 1;
    var length = serializedObject.length;

    return deserializeKeyValuePairs(serializedObject, aDeserializedObject, startIndex, length, context, setterMethod, fromObjectSerialization);
}

