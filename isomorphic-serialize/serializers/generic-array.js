
var isArray = Array.isArray;

function serializeGenericArray(serializedArray, anArray, aContext, toObjectSerialization)
{
    var i = 0;

    if (!isArray(anArray))
    {
        // Immutable List.
        var count = anArray.size;

        for (; i < count; i++)
            serializedArray[i + 1] = toObjectSerialization(anArray.get(i), aContext);

        return serializedArray;
    }

    var indexCount = 0;
    var lastIndex = -1;
    var hasGaps = false;
    var insertionIndex = serializedArray.length;

    var gapLengthIndex = -1;
    var currentGapLength = 0;

    anArray.forEach(function(aValue, aCurrentIndex)
    {
        ++indexCount;
        var isSuccessiveIndex = aCurrentIndex === lastIndex + 1;

        if (!hasGaps && isSuccessiveIndex)
            serializedArray[insertionIndex++] = toObjectSerialization(aValue, aContext);
        else if (!isSuccessiveIndex)
        {
            if (!hasGaps)
            {
                // Use an empty array to signify we've moved to gapped serialization.
                serializedArray[insertionIndex++] = [];
                hasGaps = true;
            }
            else
            {
                // The previous gap just ended, fill in the size.
                serializedArray[gapLengthIndex] = currentGapLength;
            }

            // Fill in the index on which the gap starts.
            serializedArray[insertionIndex++] = aCurrentIndex;
            // When we're done with this gap, fill this number in.
            gapLengthIndex = insertionIndex++;
            currentGapLength = 1;

            serializedArray[insertionIndex++] = toObjectSerialization(aValue, aContext);
        }
        else if (hasGaps && isSuccessiveIndex)
        {
            serializedArray[insertionIndex++] = toObjectSerialization(aValue, aContext);
            currentGapLength++;
        }

        lastIndex = aCurrentIndex;
    });

    var numberofTrailingUndefineds = (anArray.length - 1) - lastIndex;
    // Add gaps.
    if (numberofTrailingUndefineds > 0)
    {
        // Pad the end of the encoding with an empty "gap".
        // from lastIndex to length - indexCount

        if (!hasGaps)
        {
            hasGaps = true;
            serializedArray[insertionIndex++] = [];
        }

        serializedArray[insertionIndex++] = ++lastIndex;
        serializedArray[insertionIndex++] = numberofTrailingUndefineds;
    }


    if (hasGaps)
        serializedArray[gapLengthIndex] = currentGapLength;

    var keys = Object.keys(anArray);

    if (keys.length === indexCount)
        return serializedArray;


    // Add key/value pairs.

    if (!hasGaps)
        serializedArray[insertionIndex++] = [];

    serializedArray[insertionIndex++] = [];

    for (var i = 0; i < keys.length; i++)
    {
        var key = keys[i];

        if (isArrayIndex(key))
            continue;

        var value = anArray[key];

        serializedArray[insertionIndex++] = toObjectSerialization(key, aContext, true);
        serializedArray[insertionIndex++] = toObjectSerialization(value, aContext);
    }

    return serializedArray;

}

module.exports = serializeGenericArray;

var MAX_UINT32 = -1 >>> 0;

// ECMAScript 9.4.2 NOTE: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-array-exotic-objects
function isArrayIndex(aString)
{
    var UInt32Value = ToUInt32(aString);

    return UInt32Value + "" === aString && UInt32Value !== MAX_UINT32;
}

// ECMAScript 7.1.6: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-touint32
function ToUInt32(aString)
{
    return aString >>> 0;
}
