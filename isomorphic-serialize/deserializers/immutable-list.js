
module.exports = deserializeLegacyArray;

function deserializeLegacyArray(aDeserializedList, serializedList, context, fromObjectSerialization)
{
    // index 0 is the type, all other values are deseriailzed and inserted into the
    // deserialized array in their current order.
    var valueIndex = 1;
    var count = serializedList.length;

    for (; valueIndex < count; valueIndex++)
    {
        var serializedValue = serializedList[valueIndex];
        var value = fromObjectSerialization(serializedValue, context);

        aDeserializedList.push(value);
    }

    return aDeserializedList;
}
