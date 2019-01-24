const { data, number, string } = require("@algebraic/type");
const { OrderedSet, Set } = require("@algebraic/collections");

module.exports = data `Metadata` (
    dependencies    => [OrderedSet(string), OrderedSet(string)()],
    entrypoints     => [Set(string), Set(string)()],
    assets          => [Set(string), Set(string)()],
    globals         => [Set(string), Set(string)()] );
