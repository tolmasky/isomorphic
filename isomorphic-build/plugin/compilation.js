const { data, number, string } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");

module.exports = data `Compilation` (
    filename        => string,
    dependencies    => [List(string), List(string)()],
    entrypoints     => [Set(string), Set(string)()] );
