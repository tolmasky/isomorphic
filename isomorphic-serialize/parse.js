
var fromObjectSerialization = require("./from-object-serialization");

module.exports = function(aString, options)
{
    return fromObjectSerialization(JSON.parse(aString), options)
}
