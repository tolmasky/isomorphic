
var Call = (Function.prototype.call).bind(Function.prototype.call);
var ArrayPush = Array.prototype.push;

module.exports = serializedPureSet;

function serializedPureSet(aSerializedSet, aSet, aContext, toObjectSerialization)
{
    // The evaluator doesn't use Sets so safely use the object's method.
    var values = aSet.values();

    while (true)
    {
        var currentValue = values.next();

        if (currentValue.done)
            break;

        var serializedValue = toObjectSerialization(currentValue.value, aContext);
        Call(ArrayPush, aSerializedSet, serializedValue);
    }

    return aSerializedSet;
}
