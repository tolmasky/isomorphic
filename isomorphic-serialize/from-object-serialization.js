
var Types = require("./types");
var invoker = require("./utils").invoker;

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
        deserializedObjects: deserializedObjects,
        typeMap: anObjectSerialization.typeMap || { "0": 0, "1": 1 }
    };

    return fromObjectSerialization(anObjectSerialization.index, context);
};

function fromObjectSerialization(index, context)
{
    switch(index)
    {
        case -1:
            return null;
        case -2:
            return undefined;
        case -3:
            return NaN;
        case -4:
            return -0;
        case -5:
            return -Infinity;
        case -6:
            return Infinity;
    }

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

    var encodedType = serializedObject[0];
    var internalType = context.typeMap[encodedType];
    var base = Types.getBase(internalType, context);

    context.deserializedObjects[index] = base;
    return deserialize(base, internalType, serializedObject, context, fromObjectSerialization);
}

var ImmutableTypeStart = Types.ImmutableTypeStart;
var deserializers = Types.deserializers;
var immutableWithMutations = invoker("withMutations");

function deserialize(aBase, anInternalType, aSerializedObject, aContext, fromObjectSerialization)
{
    var mutator = deserializers[anInternalType];

    var isImmutable = aContext.options.immutable || anInternalType >= ImmutableTypeStart;
    var withMutationsFunction = isImmutable ? immutableWithMutations : withMutations;

    return withMutationsFunction(function(aDeserializedObject)
    {
        return mutator(aDeserializedObject, aSerializedObject, aContext, fromObjectSerialization);
    }, aBase);
};

function withMutations(aMutator, anObject)
{
    aMutator(anObject);
    return anObject;
}