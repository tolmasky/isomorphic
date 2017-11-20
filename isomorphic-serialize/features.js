
var LegacyArraySerialation = 1 << 0;
var IndexCompression       = 1 << 1;

var DEFAULTS = {
    "1": LegacyArraySerialation,
    "2": IndexCompression,
};

var DEFAULT_PROTOCOL = 2;

module.exports = function features(protocol)
{
    return DEFAULTS[protocol];
};

module.exports.features = module.exports;

module.exports.DEFAULT_PROTOCOL = DEFAULT_PROTOCOL;
module.exports.LegacyArraySerialation = LegacyArraySerialation;
module.exports.IndexCompression = IndexCompression;
