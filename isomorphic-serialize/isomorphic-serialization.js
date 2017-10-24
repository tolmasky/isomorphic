

// Return a string containing the serialized value.
module.exports.stringify = require("./stringify");

// Parse a string returning the deserialized value.
// Optionally takes an options object argument:
//   - `immutable`: If this option is true the
//      deserialized object will use immutable
//      collections instead of native Javascript collections.
module.exports.parse = require("./parse");


// Returns a serialized value which can later be JSON stringified.
// Note: usually you'll want to use `stringify` directly.
module.exports.toObjectSerialization = require("./to-object-serialization");
// Returns a deserialized value. This function does not expect a
// string but rather the output of `toObjectSerialization`.
// Note: usually you'll want to use `parse` directly.
module.exports.fromObjectSerialization = require("./from-object-serialization");
