// R/I/RI will NOT be available when we eval this function client side
// but they will only be used if "immutable" is requested, which it won't be
// DO NOT USE unless "immutable" option is true
try {
    var R = require("ramda");
    var I = require("immutable");
    var RI = require("ramda-immutable");
} catch(e) {
}

module.exports = function(anObjectSerialization, options)
{
    var immutable = options && options.immutable;
    var serializedObjects = anObjectSerialization.objects;
    var deserializedObjects = [];

    var List = immutable ? I.List : function() { return []; };
    var Map = immutable ? I.Map : function() { return Object.create(null); };
    var set = immutable ? RI.set : setValueForKey;
    var withMutations = immutable ? R.invoker(1, "withMutations") : function(fn, x) { fn(x); return x; };

    return fromObjectSerialization(anObjectSerialization.index);

    function fromObjectSerialization(index)
    {
        if (index === -1)
            return null;

        if (index === -2)
            return undefined;

        if (index === -3)
            return NaN;

        if (index === -4)
            return -0;

        if (index === -5)
            return -Infinity;

        if (index === -6)
            return Infinity;

        if (deserializedObjects.hasOwnProperty(index))
            return deserializedObjects[index];

        var serializedObject = anObjectSerialization.objects[index];

        if (typeof serializedObject !== "object")
        {
            deserializedObjects[index] = serializedObject;

            return serializedObject;
        }


        var base = serializedObject[0] ? List() : Map();

        if (serializedObject.length <= 1)
            return base;

        return withMutations(function(aDeserializedObject)
        {
            deserializedObjects[index] = aDeserializedObject;

            var keyIndex = 1;
            var count = serializedObject.length;

            for (; keyIndex < count; keyIndex += 2)
            {
                var key = serializedObject[keyIndex];

                set(typeof key === "string" ? key : fromObjectSerialization(key),
                    fromObjectSerialization(serializedObject[keyIndex + 1]),
                    aDeserializedObject);
            }
        }, base);
    }

    function setValueForKey(aKey, aValue, anObject)
    {
        anObject[aKey] = aValue;
    }
}

