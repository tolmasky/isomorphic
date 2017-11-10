
const invoker = require("../utils").invoker;

module.exports = deserializeArray;

var GaplessMode  = 1;
var GapMode      = 2;
var KeyValueMode = 3;

function deserializeArray(aDeserializedArray, serializedArray, context, fromObjectSerialization)
{
    var forceImmutable = context.options.immutable;
    var set = forceImmutable ? invoker("set") : setValueForKey;

    var mode = GaplessMode;

    var currentReadIndex = 1;
    var currentInsertionIndex = 0;
    var length = serializedArray.length;

    var gapStart = -1;
    var gapLength = -1;
    var currentGapIndexCount = 0;

    for (; currentReadIndex < length; currentReadIndex++)
    {
        var value = serializedArray[currentReadIndex];
        var isTerminal = Array.isArray(value);

        if (isTerminal)
        {
            mode++;
            continue;
        }

        if (mode === GaplessMode)
            set(currentInsertionIndex++, fromObjectSerialization(value, context), aDeserializedArray);
        else if (mode === GapMode)
        {
            if (currentGapIndexCount > gapLength)
            {
                gapStart = value;
                gapLength = serializedArray[++currentReadIndex];
                currentGapIndexCount = 0;
            }
            else
            {
                set(gapStart + currentGapIndexCount, fromObjectSerialization(value, context), aDeserializedArray);
                currentGapIndexCount++;
            }
        }
        else if (mode === KeyValueMode)
        {
            var deserializedKey = fromObjectSerialization(value, context);
            var deserializedValue = fromObjectSerialization(serializedArray[++currentReadIndex], context);
            set(deserializedKey, deserializedValue, aDeserializedArray);
        }
    }

    return aDeserializedArray;
}

function setValueForKey(aKey, anItem, anObject)
{
    anObject[aKey] = anItem;
}
