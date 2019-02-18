const { data, number, string, parameterized, Maybe } = require("@algebraic/type");
const { List, Set } = require("@algebraic/collections");

const Output = data `Compilation.Output` (
    filename    => string,
    sourceMap   => [Maybe(string), Maybe(string).Nothing],
    size        => number,
    offset      => Output.Offset);

Offset = data `Compilation.Output.Offset` (
    line    => [number, 0],
    column  => [number, 0] );

Offset.sum = function (lhs, rhs)
{
    return rhs.line > 0 ?
        Offset({ line: lhs.line + rhs.line, column: rhs.column }) :
        Offset({ line: lhs.line, column: lhs.column + rhs.column });
}

Offset.fromString = function OffsetFromString(string)
{
    let line = 0;
    let column = 0;
    let index = 0;
    const count = string.length;

    for (; index < count; ++index)
        if (string.charAt(index) === "\n")
        {
            ++line;
            column = 0;
        }
        else
            ++column;

    return Offset({ line, column });
}

module.exports = parameterized (T =>
    data `Compilation<${T}>` (
        filename        => string,
        output          => Output,
        dependencies    => [List(string), List(string)()],
        entrypoints     => [Set(string), Set(string)()],
        metadata        => T ) );

module.exports.Output = Output;
module.exports.Output.Offset = Offset;
