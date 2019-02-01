const { data, number, string } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");

module.exports = data `Compilation` (
    output          => string,
    dependencies    => [List(string), List(string)()],
    entrypoints     => [Set(string), Set(string)()],
    assets          => [Set(string), Set(string)()] );
