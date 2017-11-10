var Call = (Function.prototype.call).bind(Function.prototype.call);
var ArrayPush = Array.prototype.push;

function serializeKeyValueArray(aSerializedArray, anArray, aContext, toObjectSerialization)
{
    var keys = Object.keys(anArray);
    var count = keys.length;

    for(var i = 0; i < count; i += 2)
    {
        var key = keys[i];
        var value = anArray[key];

        var serializedKey = toObjectSerialization(key, aContext, true);
        var serializedValue = toObjectSerialization(value, aContext);

        // FIXME: this can be faster with direct assign.
        Call(ArrayPush, aSerializedArray, serializedKey, serializedValue);
    }

    return aSerializedArray;
}

module.exports = serializeKeyValueArray;
