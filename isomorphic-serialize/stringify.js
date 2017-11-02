
var toObjectSerialization = require("./to-object-serialization");

module.exports = function(anObject, anOptions)
{
    return JSON.stringify(toObjectSerialization(anObject, anOptions));
};
