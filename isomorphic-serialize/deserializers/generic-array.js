
module.exports = deserializeGenericArray;

function deserializeGenericArray(aDeserializedArray, serializedArray, context, fromObjectSerialization)
{
    // index 0 is the type, all other values are deseriailzed and inserted into the
    // deserialized array in their current order.

    // var forceImmutable = context.options.immutable;
    // var deserializedObjects = context.deserializedObjects;
    // var anObjectSerialization = context.anObjectSerialization;

    var currentIndex = 1;
    var count = serializedArray.length;

    var inNonIndexKeyMode = serializedArray[currentIndex] === -1;

    if (inNonIndexKeyMode)
        currentIndex++;

    var rangeStart = -1;
    var rangeEnd = -1;
    var positionInRange = 0;

    for (; currentIndex < count; currentIndex++)
    {
        if (inNonIndexKeyMode)
        {
            var serializedKey = serializedArray[currentIndex];
            var serializedValue = serializedArray[++currentIndex];

            var key = fromObjectSerialization(serializedKey, context);
            var value = fromObjectSerialization(serializedValue, context);
            set(key, value, aDeserializedArray);
        }
        else if (rangeStart + positionInRange === rangeEnd)
        {
            if (serializedArray[currentIndex] === -1)
                inNonIndexKeyMode = true;
            else
            {
                rangeStart = serializedArray[currentIndex];
                rangeEnd = rangeStart + serializedArray[++currentIndex];
                // Reset the position in range
                positionInRange = 0;
            }
        }
        else
        {
            var key = rangeStart + positionInRange;
            var serializedValue = serializedArray[currentIndex];
            var value = fromObjectSerialization(serializedValue, context);

            set(key, value, aDeserializedArray);
            positionInRange++;
        }
    }


    return aDeserializedArray;
}

function set(aKey, anItem, anObject)
{
    anObject[aKey] = anItem;
}

