
var isImmutable = require("immutable").List.isList;
var mapInvoker = require("../utils").invoker("map");

function serializeGaplessArray(anArray, aContext, toObjectSerialization)
{
    var map = isImmutable(anArray) ? immutableMap : mapInvoker;
    return map(serialize, anArray);

    function serialize(anObject)
    {
        return toObjectSerialization(anObject, aContext);
    }
}

module.exports = serializeGaplessArray;

function immutableMap(mapper, aList)
{
    var newItem = [];
    var count = aList.size;

    for (var i = 0; i < count; i++)
        newItem[i] = mapper(aList.get(i));

    return newItem;
}
