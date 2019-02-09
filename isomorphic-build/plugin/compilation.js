const { data, number, string, parameterized } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");

module.exports = parameterized (T =>
    data `Compilation<${T}>` (
        filename        => string,
        dependencies    => [List(string), List(string)()],
        entrypoints     => [Set(string), Set(string)()],
        metadata        => T ) );
