const Value = require("./value");


module.exports.BooleanLiteral = function BooleanLiteral(node)
{
    return Value.on(node, node.value);
}

module.exports.StringLiteral  = function StringLiteral(node)
{
    return Value.on(node, node.value);
}

module.exports.NumericLiteral = function NumericLiteral(node)
{
    return Value.on(node, node.value);
}

module.exports.RegExpLiteral = function RegExpLiteral(node)
{
    return Value.on(node, Value.Indefinite.RegExp);
}

module.exports.NullLiteral = function NullLiteral(node)
{
    return Value.on(node, null);
}

module.exports.FunctionExpression = function FunctionExpression(node)
{
    return Value.on(node, Value.Indefinite.Function);
}

module.exports.ArrowFunctionExpression  = function ArrowFunctionExpression(node)
{
    return Value.on(node, Value.Indefinite.Function);
}

module.exports.ArrayExpression = function ArrayExpression(node)
{
    return Value.on(node, Value.Indefinite.Array);
}

