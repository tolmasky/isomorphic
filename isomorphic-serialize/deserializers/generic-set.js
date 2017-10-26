
const invoker = require("../utils").invoker;
const SetAdd = function(aValue, anObject)
{
    anObject.add(aValue);
};

module.exports = deserializeGenericSet;

// This will deserialize every set.
function deserializeGenericSet(aDeserializedSet, serializedSet, context, fromObjectSerialization)
{
    var forceImmutable = context.options.immutable;
    var add = forceImmutable ? invoker("add") : SetAdd;

    // index 0 is the type.
    var numberOfGenericObjectPairs = serializedSet[1];

    // First key starts at index 2.
    var index = 2;
    var count = serializedSet.length;

    for (; index < count; index++)
    {
        if (index < numberOfGenericObjectPairs * 2)
        {
            var serializedKey = serializedSet[index];
            var serializedValue = serializedSet[++index];

            var key = fromObjectSerialization(serializedKey, context);
            var value = fromObjectSerialization(serializedValue, context);

            setValueForKey(key, value, aDeserializedSet);
            continue;
        }
        else
        {
            var serializedValue = serializedSet[index];
            var value = fromObjectSerialization(serializedValue, context);
            add(value, aDeserializedSet);
        }
    }

    return aDeserializedSet;
}

function setValueForKey(aKey, aValue, anObject)
{
    anObject[aKey] = aValue;
}
