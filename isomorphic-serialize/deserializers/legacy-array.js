
var deserializeKeyValuePairs = require("./generic-key-value-pairs");
module.exports = deserializeLegacyArray;

function deserializeLegacyArray(aDeserializedArray, serializedArray, context, fromObjectSerialization)
{
    var forceImmutable = context.options.immutable;
    var set = forceImmutable && "set";

    return deserializeKeyValuePairs(serializedArray, aDeserializedArray, 1, serializedArray.length, context, set, fromObjectSerialization);
}
