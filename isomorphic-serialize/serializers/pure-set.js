
module.exports = serializedPureSet;

function serializedPureSet(aSet, aContext, toObjectSerialization)
{
    var serializedObject = [];

    var values = aSet.values();

    for (var aValue of values)
    {
        var serializedValue = toObjectSerialization(aValue, aContext);
        serializedObject.push(serializedValue);
    }

    return serializedObject;
}
