
var IS_LIST_SENTINEL = "@@__IMMUTABLE_LIST__@@";

function serializeGaplessArray(serializedObject, anArray, aContext, toObjectSerialization)
{
    var i = 0;

    if (anArray[IS_LIST_SENTINEL])
    {
        var count = anArray.size;

        for (; i < count; i++)
            serializedObject[i + 1] = toObjectSerialization(anArray.get(i), aContext);
    }
    else
    {
        var count = anArray.length;

        for (; i < count; i++)
            serializedObject[i + 1] = toObjectSerialization(anArray[i], aContext);
    }

    return serializedObject;
}

module.exports = serializeGaplessArray;


