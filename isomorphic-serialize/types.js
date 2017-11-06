
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
var ImmutableOrderedMap = 11;
var ImmutableOrderedSet = 12;

module.exports.defaultTypes = [
    GenericObject,
    JustKeyValueArray,
    GaplessArray,
    GenericArray,
    NoKeyValueSet,
    GenericSet,
    NoKeyValueMap,
    GenericMap,
    ImmutableMap,
    ImmutableSet,
    ImmutableList,
    ImmutableOrderedMap,
    ImmutableOrderedSet,
];

module.exports.GenericObject = GenericObject;
module.exports.JustKeyValueArray = JustKeyValueArray;
module.exports.GaplessArray = GaplessArray;
module.exports.GenericArray = GenericArray;
module.exports.NoKeyValueSet = NoKeyValueSet;
module.exports.GenericSet  = GenericSet;
module.exports.NoKeyValueMap = NoKeyValueMap;
module.exports.GenericMap = GenericMap;
module.exports.ImmutableMap = ImmutableMap;
module.exports.ImmutableSet = ImmutableSet;
module.exports.ImmutableList = ImmutableList;
module.exports.ImmutableOrderedMap = ImmutableOrderedMap;
module.exports.ImmutableOrderedSet = ImmutableOrderedSet;

module.exports.ImmutableTypeStart = 8;
