
const I = require("immutable");
const isArray = Array.isArray;
const isMap = anObject => anObject instanceof Map;
const isSet = anObject => anObject instanceof Set;


module.exports.ObjectType = 0;
module.exports.ArrayType = 1;
module.exports.MapType = 2;
module.exports.SetType = 3;
module.exports.ImmutableMapType = 4;
module.exports.ImmutableListType = 5;
module.exports.ImmutableSetType = 6;

module.exports.EmptyType = [
    () => ({}),
    () => [],
    () => new Map(),
    () => new Set(),
    I.Map,
    I.List,
    I.Set
];

module.exports.isImmutableType = isImmutableType;
module.exports.toImmutableType = toImmutableType;
module.exports.getType = getType;

function isImmutableType(aType)
{
    return aType >= 4;
}

function toImmutableType(aType)
{
    if (aType === module.exports.ObjectType || module.exports.MapType === 2)
        return I.Map;
    if (aType === module.exports.ArrayType)
        return I.List;
    if (aType === module.exports.SetType)
        return I.Set;
}

function getType(anObject)
{

    var tests = [isArray, isMap, isSet, I.Map.isMap, I.List.isList, I.Set.isSet];

    for (var i = 0; i < tests.length; i++)
    {
        if (tests[i](anObject))
            return i + 1;
    }

    return 0;
}