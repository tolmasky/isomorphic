const { data, number, string, parameterized, Maybe } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");

const Output = data `Compilation.Output` (
    filename    => string,
    sourceMap   => [Maybe(string), Maybe(string).Nothing],
    size        => number,
    lineCount   => number);

module.exports = parameterized (T =>
    data `Compilation<${T}>` (
        filename        => string,
        output          => Output,
        dependencies    => [List(string), List(string)()],
        entrypoints     => [Set(string), Set(string)()],
        metadata        => T ) );

module.exports.Output = Output;
