const { data, number, string, parameterized, Maybe } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");

module.exports = parameterized (T =>
    data `Compilation<${T}>` (
        filename        => string,
        sourceMapPath   => [Maybe(string), Maybe(string).Nothing],
        size            => number,
        lineCount       => number,
        dependencies    => [List(string), List(string)()],
        entrypoints     => [Set(string), Set(string)()],
        metadata        => T ) );
