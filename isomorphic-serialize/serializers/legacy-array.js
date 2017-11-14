var Call = (Function.prototype.call).bind(Function.prototype.call);
var ArrayPush = Array.prototype.push;
var ObjectKeys = Object.keys;

function serializeKeyValueArray(aSerializedArray, anArray, aContext, toObjectSerialization)
{
    var keys = ObjectKeys(anArray);
    var count = keys.length;

    for(var i = 0; i < count; i++)
    {
        var key = keys[i];
        var value = anArray[key];

        var serializedValue = toObjectSerialization(value, aContext);
        var serializedKey = toObjectSerialization(key, aContext, true);

        // FIXME: this can be faster with direct assign.
        Call(ArrayPush, aSerializedArray, serializedKey, serializedValue);
    }

    return aSerializedArray;
}

module.exports = serializeKeyValueArray;
