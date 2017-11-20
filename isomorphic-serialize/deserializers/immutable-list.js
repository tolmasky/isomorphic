
module.exports = deserializeGaplessArray;

function deserializeGaplessArray(aDeserializedArray, serializedArray, context, fromObjectSerialization)
{
    // index 0 is the type, all other values are deseriailzed and inserted into the
    // deserialized array in their current order.
    var valueIndex = 1;
    var count = serializedArray.length;

    for (; valueIndex < count; valueIndex++)
    {
        var serializedValue = serializedArray[valueIndex];
        var value = fromObjectSerialization(serializedValue, context);

        aDeserializedArray.push(value);
    }

    return aDeserializedArray;
}
