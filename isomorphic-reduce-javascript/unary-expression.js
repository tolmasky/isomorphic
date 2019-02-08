const { is } = require("@algebraic/type");
const reduce = require(".");
const { Value, Unknown, toBoolean, toNumber } = require("./value");
const { PureNode, fromDefinite } = require("./node-type");


module.exports.UnaryExpression = function UnaryExpression(node)
{
    const { operator, prefix, argument } = node;
    const argument_ = reduce(argument);
    const inValue = Value.from(argument_);

    const value = 
        !prefix ?               Unknown :
        operator === "void" ?   void(0) :

        // Bottom?
        operator === "throw" ?  Unknown :
        operator === "delete" ? Unknown :

        operator === "typeof" ? tryTypeof(inValue) :

        operator === "!" ?
            Value.isPureCoercableToBoolean(inValue) ?
                !toBoolean(inValue) :
                Unknown :

        !Value.isPureCoercableToNumber(inValue) ?
            Unknown :
            operator === "+" ? +toNumber(inValue) :
            operator === "-" ? -toNumber(inValue) :
            operator === "~" ? ~toNumber(inValue) :

        unreachable();

    if (Value.equals(value, inValue))
        return argument_;

    // If the argument is a literal, then we can safely drop it.
    // !(x,false) and -(x,5) are examples of arguments we can't drop despite
    // having definite compile time values.
    if (is(Value.Definite, value) && is(PureNode, argument_))
        return fromDefinite(value);

    // For example, !(x && false), we know the value will be true, but we have
    // to keep x since it could theoretically be a property access in a with.
    const newNode = argument === argument_ ?
        node :
        { ...node, argument: argument_ };

    return Value.on(node, value);
}

function tryTypeof(value)
{
    if (is(Value.Definite, value))
        return typeof value;

    if (value === Value.Indefinite.Symbol)
        return "symbol";

    if (value === Unknown ||
        value === Value.Indefinite.Truthy ||
        value === Value.Indefinite.Falsey)
        return Unknown;

    return "object";
}

