
function serializeGaplessArray(anArray, aContext, toObjectSerialization)
{
    return anArray.map(serialize);

    function serialize(anObject)
    {
        return toObjectSerialization(anObject, aContext);
    }
}

module.exports = serializeGaplessArray;
