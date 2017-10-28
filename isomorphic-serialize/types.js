
const I = require("immutable");
const isArray = Array.isArray;
const invoker = require("./utils").invoker;

module.exports.getSerializer = getSerializer;
module.exports.analyzeTypes = analyzeTypes;

module.exports.prepareForDeserialization = prepareForDeserialization;

var GenericObject     = 0;
var JustKeyValueArray = 1;
var GaplessArray      = 2;
var GenericArray      = 3;
var NoKeyValueSet     = 4;
var GenericSet        = 5;
var NoKeyValueMap     = 6;
var GenericMap        = 7;
var ImmutableMap      = 8;
var ImmutableSet      = 9;
var ImmutableList     = 10;

var ImmutableTypeStart = 8;

function getInternalType(anObject)
{
    if (isArray(anObject))
    {
        var keys = Object.keys(anObject);

        if (keys.length > 0 && anObject.length === 0)
            return JustKeyValueArray;

        if (keys.length === anObject.length)
            return GaplessArray;

        return GenericArray;
    }

    if (anObject instanceof Set)
    {
        var keys = Object.keys(anObject);
        return keys.length ? GenericSet : NoKeyValueSet;
    }

    if (anObject instanceof Map)
    {
        var keys = Object.keys(anObject);
        return keys.length ? GenericMap : NoKeyValueMap;
    }

    if (I.Map.isMap(anObject))
        return ImmutableMap;

    if (I.List.isList(anObject))
        return ImmutableList;

    if (I.Set.isSet(anObject))
        return ImmutableSet;

    return GenericObject;
}

var serializers = [
    require("./serializers/generic-object"),
    require("./serializers/key-value-array"),
    require("./serializers/gapless-array"),
    require("./serializers/generic-array"),
    require("./serializers/pure-set"),
    require("./serializers/generic-set"),
    require("./serializers/pure-map"),
    require("./serializers/generic-map"),
    require("./serializers/pure-map"), // Immutable map can use pure-map.
    require("./serializers/pure-set"), // Immutable set can use pure-set.
    require("./serializers/gapless-array") // Immutable lists can use the gapless-array serializer, but it unnecessarily encodes a lot of undefineds.
];



function getSerializer(anObject, aContext)
{
    var internalType = getInternalType(anObject);
    var serializedType = encodableType(internalType);

    return function(toObjectSerialization)
    {
        serializedType.increment();
        return [serializedType].concat(serializers[internalType](anObject, aContext, toObjectSerialization));
    };

    function encodableType(anInternalType)
    {
        var existingType = aContext.types[anInternalType];

        if (existingType)
            return existingType;

        existingType = new TypeUID(anInternalType);
        aContext.types[anInternalType] = existingType;
        return existingType;
    }
};











var deserializers = [
    require("./deserializers/generic-object"),
    require("./deserializers/key-value-array"),
    require("./deserializers/gapless-array"),
    require("./deserializers/generic-array"),
    require("./deserializers/pure-set"),
    require("./deserializers/generic-set"),
    require("./deserializers/pure-map"),
    require("./deserializers/generic-map"),
    require("./deserializers/pure-map"), // Immutable map can use pure-map.
    require("./deserializers/pure-set"), // Immutable set can use pure-set.
    require("./deserializers/gapless-array") // Immutable lists can use the gapless-array serializer, but it unnecessarily encodes a lot of undefineds.
];

function getBase(encodedType, aContext)
{
    if (aContext.options.immutable)
    {
        switch(encodedType)
        {
            case GenericObject:
            case NoKeyValueMap:
            case GenericMap:
                return I.Map();
            case JustKeyValueArray:
            case GaplessArray:
            case GenericArray:
                return I.List();
            case NoKeyValueSet:
            case GenericSet:
                return I.Set();
            default:
                throw new Error("unknown type...");
        }
    }

    switch(encodedType)
    {
        case GenericObject:
            return {};
        case JustKeyValueArray:
        case GaplessArray:
        case GenericArray:
            return [];
        case NoKeyValueSet:
        case GenericSet:
            return new Set();
        case NoKeyValueMap:
        case GenericMap:
            return new Map();
        case ImmutableMap:
            return I.Map();
        case ImmutableSet:
            return I.Set();
        case ImmutableList:
            return I.List();
        default:
            throw new Error("unknown type...");
    }
}

function prepareForDeserialization(aSerializedObject, aContext, fromObjectSerialization)
{
    var encodedType = aSerializedObject[0];
    var internalType = aContext.typeMap[encodedType];

    var base = getBase(internalType, aContext);
    var mutator = deserializers[internalType];

    var isImmutable = aContext.options.immutable || internalType >= ImmutableTypeStart;
    var withMutationsFunction = isImmutable ? immutableWithMutations : withMutations;

    return [base, function(aBaseObject)
    {
        return withMutationsFunction(function(aDeserializedObject)
        {
            return mutator(aDeserializedObject, aSerializedObject, aContext, fromObjectSerialization);
        }, aBaseObject);
    }];
};

var immutableWithMutations = invoker("withMutations");

function withMutations(aMutator, anObject)
{
    aMutator(anObject);
    return anObject;
}

function TypeUID(aType)
{
    this.internalType = aType;
    this.count = 0;
    this.__UNIQUE_ID = undefined;
}

TypeUID.prototype.increment = function()
{
    this.count += 1;
};

TypeUID.prototype.toJSON = function()
{
    return this.__UNIQUE_ID;
};

function analyzeTypes(aContext)
{
    var keys = Object.keys(aContext.types);

    var allTypes = keys.map(function(aKey)
    {
        return aContext.types[aKey];
    });

    allTypes.sort(function(a, b)
    {
        return b.count - a.count;
    });

    var finalMapping = {};

    allTypes.forEach(function(aType, anIndex)
    {
        aType.__UNIQUE_ID = anIndex;
        finalMapping[anIndex] = aType.internalType;
    });

    return finalMapping;
}
