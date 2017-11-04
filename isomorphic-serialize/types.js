
var I = require("immutable");
var isArray = Array.isArray;
var ObjectKeys = Object.keys;
var Call = (Function.prototype.call).bind(Function.prototype.call);
var ArrayMap = Array.prototype.map;
var ArraySort = Array.prototype.sort;

module.exports.getInternalType = getInternalType;
module.exports.encodableType = encodableType;
module.exports.analyzeTypes = analyzeTypes;
module.exports.getBase = getBase;

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

module.exports.ImmutableTypeStart = 8;

module.exports.serializers = [
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

module.exports.deserializers = [
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

var IS_MAP_SENTINEL = "@@__IMMUTABLE_MAP__@@";
var IS_SET_SENTINEL = "@@__IMMUTABLE_SET__@@";
var IS_LIST_SENTINEL = "@@__IMMUTABLE_LIST__@@";

function getInternalType(anObject)
{
    if (isArray(anObject))
    {
        var keys = ObjectKeys(anObject);

        if (keys.length > 0 && anObject.length === 0)
            return JustKeyValueArray;

        if (keys.length === anObject.length)
            return GaplessArray;

        return GenericArray;
    }

    if (anObject instanceof Set)
    {
        var keys = ObjectKeys(anObject);
        return keys.length ? GenericSet : NoKeyValueSet;
    }

    if (anObject instanceof Map)
    {
        var keys = ObjectKeys(anObject);
        return keys.length ? GenericMap : NoKeyValueMap;
    }

    // if (I.Map.isMap(anObject))
    if (anObject[IS_MAP_SENTINEL])
        return ImmutableMap;

    // if (I.List.isList(anObject))
    if (anObject[IS_LIST_SENTINEL])
        return ImmutableList;

    // if (I.Set.isSet(anObject))
    if (anObject[IS_SET_SENTINEL])
        return ImmutableSet;

    return GenericObject;
}

function encodableType(anInternalType, aContext)
{
    var existingType = aContext.types[anInternalType];

    if (existingType)
        return existingType;

    return aContext.types[anInternalType] = new TypeUID(anInternalType);
}

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

function TypeUID(aType)
{
    this.internalType = aType;
    this.count = 0;
    this.__UNIQUE_ID = aType;
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
    var keys = ObjectKeys(aContext.types);

    var allTypes = Call(ArrayMap, keys, function(aKey)
    {
        return aContext.types[aKey];
    });

    Call(ArraySort, allTypes, function(a, b)
    {
        return b.count - a.count;
    });

    var finalMapping = {};

    for (var i = 0; i < allTypes.length; i++)
    {
        var aType = allTypes[i];
        aType.__UNIQUE_ID = i;
        finalMapping[i] = aType.internalType;
    }

    return finalMapping;
}
