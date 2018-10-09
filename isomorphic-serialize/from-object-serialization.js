
var I = require("immutable");
var Types = require("./types");
var ImmutableTypeStart = Types.ImmutableTypeStart;
var Set = global.Set;
var Map = global.Map;

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
        typeMap: anObjectSerialization.typeMap || Types.defaultTypes
    };

    return fromObjectSerialization(anObjectSerialization.index, context);
};

var deserializers = [
    require("./deserializers/generic-object"),
    require("./deserializers/legacy-array"),
    require("./deserializers/generic-array"),
    require("./deserializers/pure-set"),
    require("./deserializers/generic-set"),
    require("./deserializers/pure-map"),
    require("./deserializers/generic-map"),
    require("./deserializers/pure-map"), // Immutable map can use pure-map.
    require("./deserializers/pure-set"), // Immutable set can use pure-set.
    require("./deserializers/immutable-list"), // Immutable lists can use the gapless-array serializer, but it unnecessarily encodes a lot of undefineds.
    require("./deserializers/pure-map"), // Immutable ordered map can use pure-map.
    require("./deserializers/pure-set"), // Immutable ordered set can use pure-set.
];


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
    var base = getBase(internalType, context);

    context.deserializedObjects[index] = base;

    var mutator = deserializers[internalType];

    var isImmutable = context.options.immutable || internalType >= ImmutableTypeStart;

    if (isImmutable)
    {
        return context.deserializedObjects[index] = base.withMutations(function(aDeserializedObject)
        {
            context.deserializedObjects[index] = aDeserializedObject;
            mutator(aDeserializedObject, serializedObject, context, fromObjectSerialization);
        });
    }

    return mutator(base, serializedObject, context, fromObjectSerialization);
}

function getBase(encodedType, aContext)
{
    if (aContext.options.immutable)
    {
        switch(encodedType)
        {
            case Types.GenericObject:
            case Types.NoKeyValueMap:
            case Types.GenericMap:
            case Types.ImmutableMap:
                return I.Map();
            case Types.LegacyArray:
            case Types.Array:
            case Types.ImmutableList:
                return I.List();
            case Types.NoKeyValueSet:
            case Types.GenericSet:
            case Types.ImmutableSet:
                return I.Set();
            case Types.ImmutableOrderedMap:
                return I.OrderedMap();
            case Types.ImmutableOrderedSet:
                return I.OrderedSet();
            default:
                throw new Error("unknown type..." + encodedType);
        }
    }

    switch(encodedType)
    {
        case Types.GenericObject:
            return {};
        case Types.LegacyArray:
        case Types.Array:
            return [];
        case Types.NoKeyValueSet:
        case Types.GenericSet:
            return new Set();
        case Types.NoKeyValueMap:
        case Types.GenericMap:
            return new Map();
        case Types.ImmutableMap:
            return I.Map();
        case Types.ImmutableSet:
            return I.Set();
        case Types.ImmutableList:
            return I.List();
        case Types.ImmutableOrderedMap:
            return I.OrderedMap();
        case Types.ImmutableOrderedSet:
            return I.OrderedSet();
        default:
            throw new Error("unknown type..." + encodedType);
    }
}