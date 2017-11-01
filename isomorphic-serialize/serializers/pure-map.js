
var Call = (Function.prototype.call).bind(Function.prototype.call);
var ArrayPush = Array.prototype.push;

module.exports = serializedPureMap;

function serializedPureMap(aSerializedMap, aMap, aContext, toObjectSerialization)
{
    // It is safe to do this because the evaluators don't use Maps internally and thus
    // this code path should never be called in the evaluator.
    var keys = aMap.keys();

    while (true)
    {
        var currentValue = keys.next();

        if (currentValue.done)
            break;

        var aKey = currentValue.value;
        var value = aMap.get(aKey);

        var serializedKey = toObjectSerialization(aKey, aContext);
        var serializedValue = toObjectSerialization(value, aContext);

        Call(ArrayPush, aSerializedMap, serializedKey, serializedValue);
    }

    return aSerializedMap;
}
