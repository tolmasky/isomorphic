const { is } = require("@algebraic/type");
const t = require("@babel/types");
const reduce = require(".");
const { Value, isPureCoercableToBoolean } = require("./value");
const { PureNode } = require("./node-type");


module.exports.IfStatement = function IfStatement(node)
{
    const test_ = reduce(node.test);
    const consequent_ = asStatement(reduce(node.consequent));
    const alternate_ = node.alternate && asStatement(reduce(node.alternate));
    const testValue = Value.from(test_);

    // If there's no information, just have to keep the whole structure.
    if (!isPureCoercableToBoolean(testValue))
        return  test_ === node.test &&
                consequent_ === node.consequent &&
                alternate_ === node.alternate ?
            node :
            t.ifStatement(test_, consequent_, alternate_);

    const passes = Value.toBoolean(testValue);

    // If we've reduced this down to a pure type, we can drop one of these.
    if (is(PureNode, test_))
        return passes ?
            consequent_ || t.emptyStatement() :
            alternate_ || t.emptyStatement();

    return passes ?
        consequent_ ?
            t.ifStatement(test_, consequent_) :
            test_ :
        alternate_ ?
            t.ifStatement(t.unaryExpression("!", test_), alternate_) :
            test_;
}

function asStatement(node)
{
    if (t.isStatement(node))
        return node;
    
    return Value.on(t.expressionStatement(node), Value.from(node));
}
