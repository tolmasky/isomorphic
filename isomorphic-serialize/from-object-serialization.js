
var I = require("immutable");
var Types = require("./types");

// Returns a deserialized object.
// Expects a serialized object and an options object.
// options:
// `immutable`: BOOL — Forces the deserialized object to be immutable.
module.exports = function(anObjectSerialization, options)
{
    var deserializedObjects = [];
    var context = {
        options: options || {},
        anObjectSerialization: anObjectSerialization,
        deserializedObjects: deserializedObjects
    };

    return fromObjectSerialization(anObjectSerialization.index, context);
};

function fromObjectSerialization(index, context)
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

    // Check to see if the object has already been deserialized.
    if (context.deserializedObjects.hasOwnProperty(index))
        return context.deserializedObjects[index];

    var serializedObject = context.anObjectSerialization.objects[index];

    if (typeof serializedObject !== "object")
    {
        // Numbers, Strings, and Booleans don't need any extra work.
        context.deserializedObjects[index] = serializedObject;
        return serializedObject;
    }

    // Everything that remains is a collection.
    var value = Types.getDeserializer(serializedObject, context)(fromObjectSerialization);
    context.deserializedObjects[index] = value;

    return value;
}

// function fromObjectSerialization(index, anObjectSerialization, forceImmutable, deserializedObjects)
// {
//     if (index === -1)
//         return null;
//     if (index === -2)
//         return undefined;
//     if (index === -3)
//         return NaN;
//     if (index === -4)
//         return -0;
//     if (index === -5)
//         return -Infinity;
//     if (index === -6)
//         return Infinity;

//     // Check to see if the object has already been deserialized.
//     if (deserializedObjects.hasOwnProperty(index))
//         return deserializedObjects[index];

//     var serializedObject = anObjectSerialization.objects[index];

//     if (typeof serializedObject !== "object")
//     {
//         // Numbers, Strings, and Booleans don't need any extra work.
//         deserializedObjects[index] = serializedObject;
//         return serializedObject;
//     }

//     // Serialized objects have the following format:
//     // [type, recursively, serialized, items, fill, up, the, array].
//     var type = serializedObject[0];
//     var base = (forceImmutable ? toImmutableType(type) : EmptyType[type])();

//     var isImmutable = forceImmutable || isImmutableType(type);

//     var withMutations = isImmutable ? invoker("withMutations") : function(fn, x) { fn(x); return x; };
//     var add = isImmutable ? invoker("add") : addValue;
//     var set = isImmutable ? invoker("set") : setValueForKey;

//     // Empty collection.
//     if (serializedObject.length <= 1)
//         return base;

//     return withMutations(function(aDeserializedObject)
//     {
//         deserializedObjects[index] = aDeserializedObject;

//         var hasKey = type !== 3 && type !== 6;
//         var keyIndex = 1;
//         var count = serializedObject.length;

//         // Most collection have keys and values, they appear as [key, value]
//         // in the serialized object. Sets do not have keys.
//         for (; keyIndex < count; keyIndex += 1)
//         {
//             if (hasKey)
//             {
//                 var serializedKey = serializedObject[keyIndex];

//                 var key = typeof serializedKey === "string"
//                         ? serializedKey
//                         : fromObjectSerialization(serializedKey, anObjectSerialization, forceImmutable, deserializedObjects);

//                 var object = fromObjectSerialization(serializedObject[++keyIndex], anObjectSerialization, forceImmutable, deserializedObjects);
//                 set(key, object, aDeserializedObject);
//             }
//             else
//             {
//                 var object = fromObjectSerialization(serializedObject[keyIndex], anObjectSerialization, forceImmutable, deserializedObjects);
//                 add(object, aDeserializedObject);
//             }
//         }
//     }, base);
// };

function setValueForKey(aKey, aValue, anObject)
{
    anObject[aKey] = aValue;
}

function addValue(aValue, anObject)
{
    anObject.add(aValue);
}
