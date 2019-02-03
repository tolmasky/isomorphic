const { is } = require("@algebraic/type");
const reduce = require(".");
const { Value, Unknown } = require("./value");
const { PureNode, fromDefinite } = require("./node-type");


module.exports.BinaryExpression = function BinaryExpression (node)
{
    const { operator, left, right } = node;
    const left_ = reduce(left);
    const right_ = reduce(right);

    const leftValue = Value.from(left_);
    const rightValue = Value.from(right_);

    const value =
        !is(Value.Definite, leftValue) &&
        !is(Value.Definite, rightValue) ? Unknown :

        operator === "+" ? leftValue + rightValue :
        operator === "-" ? leftValue - rightValue :
        operator === "/" ? leftValue / rightValue :
        operator === "%" ? leftValue % rightValue :
        operator === "*" ? leftValue * rightValue :
        operator === "**" ? leftValue ** rightValue :
        operator === "&" ? leftValue & rightValue :
        operator === "|" ? leftValue | rightValue :
        operator === ">>" ? leftValue >> rightValue :
        operator === ">>>" ? leftValue >>> rightValue :
        operator === "<<" ? leftValue << rightValue :
        operator === "^" ? leftValue ^ rightValue :
        operator === "==" ? leftValue == rightValue :
        operator === "===" ? leftValue === rightValue :
        operator === "!=" ? leftValue != rightValue :
        operator === "!==" ? leftValue !== rightValue :

        // Does String.prototype.x = make this unknown?
        // This is the safe option.
        operator === "in" ? Unknown :

        // This may just always be false?
        operator === "instanceof" ? leftValue instanceof rightValue :

        operator === ">" ? leftValue > rightValue :
        operator === "<" ? leftValue < rightValue :
        operator === ">=" ? leftValue >= rightValue :
        operator === "<=" ? leftValue <= rightValue :
        unreachable();

    if (is(Value.Definite, value) &&
        is(PureNode, left_) &&
        is(PureNode, right_))
        return fromDefinite(value);

    const newNode = left_ === left && right_ === right ?
        node :
        { ...node, left: left_, right: right_ };

    return Value.on(newNode, value);
}
