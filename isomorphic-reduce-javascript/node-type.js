const { is, declare } = require("@algebraic/type");
const t = require("@babel/types");
const Value = require("./value");
const undefinedNode = t.unaryExpression("void", t.numericLiteral(0));

const PURE_TYPES =
{
    "BooleanLiteral":           true,
    "NumericLiteral":           true,
    "StringLiteral":            true,
    "NullLiteral":              true,
    "RegExpLiteral":            true,
    "FunctionExpression":       true,
    "ArrowFunctionExpression":  true
};

module.exports.PureNode = declare(
{
    is: function isPureNode(node)
    {
        return PURE_TYPES[node.type];
    },
    create: () => { throw TypeError("Can't instantiate PureNode.") },
    typename: "PureNode",
    unscopedTypename: "PureNode"
});

module.exports.fromDefinite = function toLiteral(value)
{
    if (!is(Value.Definite, value))
        throw TypeError("Can't make literal node from indefinite value");

    const node =
        value === true || value === false ?
            t.booleanLiteral(value) :
        typeof value === null ?
            t.nullLiteral() :
        typeof value === "string" ?
            t.stringLiteral(value) :
        typeof value === "number" ?
            // -0?
            t.numericLiteral(value) :
        typeof value === "undefined" ?
            undefinedNode :
        unreachable();

    return Value.on(node, value);
}