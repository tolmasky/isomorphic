
var isImmutable = require("immutable").List.isList;
// var mapInvoker = require("../utils").invoker("map");

function serializeGaplessArray(serializedObject, anArray, aContext, toObjectSerialization)
{
    var i = 0;

    if (isImmutable(anArray))
    {
        var count = anArray.size;

        for (; i < count; i++)
            serializedObject[i + 1] = toObjectSerialization(anArray.get(i), aContext);

        return serializedObject;

    }
    else
    {
        var count = anArray.length;

        for (; i < count; i++)
            serializedObject[i + 1] = toObjectSerialization(anArray[i], aContext);

        return serializedObject;
    }
}

module.exports = serializeGaplessArray;


