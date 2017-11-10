
module.exports.defaultTypes = [
    module.exports.GenericObject = 0,
    module.exports.LegacyArray   = 1,
    module.exports.Array         = 2,
    module.exports.NoKeyValueSet = 3, // Sets that don't have properties hanging off them.
    module.exports.GenericSet    = 4,
    module.exports.NoKeyValueMap = 5, // Maps that don't have properties hanging off them.
    module.exports.GenericMap    = 6,
    module.exports.ImmutableMap  = 7,
    module.exports.ImmutableSet  = 8,
    module.exports.ImmutableList = 9,
    module.exports.ImmutableOrderedMap = 10,
    module.exports.ImmutableOrderedSet = 11
];

module.exports.ImmutableTypeStart = 7;
