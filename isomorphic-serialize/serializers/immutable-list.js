
function serializeImmutableList(serializedObject, aList, aContext, toObjectSerialization)
{
    var i = 0;
    var count = aList.size;

    for (; i < count; i++)
        serializedObject[i + 1] = toObjectSerialization(aList.get(i), aContext);

    return serializedObject;
}

module.exports = serializeImmutableList;


