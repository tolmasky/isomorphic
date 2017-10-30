
module.exports = serializedPureSet;

function serializedPureSet(aSerializedSet, aSet, aContext, toObjectSerialization)
{
    var values = aSet.values();

    for (var aValue of values)
    {
        var serializedValue = toObjectSerialization(aValue, aContext);
        aSerializedSet.push(serializedValue);
    }

    return aSerializedSet;
}
