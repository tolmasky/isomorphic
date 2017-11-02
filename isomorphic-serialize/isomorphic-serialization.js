

// Return a string containing the serialized value.
//   - `fastMode`: If this option is true the
//      serialized object will not be compressed.
module.exports.stringify = require("./stringify");

// Parse a string returning the deserialized value.
// Optionally takes an options object argument:
//   - `immutable`: If this option is true the
//      deserialized object will use immutable
//      collections instead of native Javascript collections.
module.exports.parse = require("./parse");

