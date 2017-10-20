
var toObjectSerialization = require("./to-object-serialization");

module.exports = function(anObject)
{
    return JSON.stringify(toObjectSerialization(anObject));
}
