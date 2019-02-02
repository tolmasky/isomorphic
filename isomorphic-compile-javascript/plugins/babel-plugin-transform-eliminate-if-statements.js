const { data, union, boolean, is } = require("@algebraic/type");

const Unknown = data `Unknown` ();
const Pure = data `Pure` (
    value => boolean );
const Impure = data `Impure` (
    value   => union `Value` (boolean, Unknown),
    node    => Object );

const name = "transform-eliminate-if-statements";

Error.stackTraceLimit = 1000;
module.exports = function({ types: t }, replacements)
{
    const IfStatement = function exit(path)
    {
        const { node } = path;
        const evaluation = evaluate(t, node.test);
        const { value } = evaluation;

        if (is(Pure, evaluation))
        {
            if (value)
                return void(path.replaceWith(node.consequent));

            return node.alternate ?
                void(path.replaceWith(node.alternate)) :
                void(path.remove());
        }

        const { node: test } = evaluation;

        if (value === Unknown)
            return test === node.test ?
                void(0) :
                void(path.replaceWith(
                    t.ifStatement(test, node.consequent, node.alternate)));

        if (value === true)
            return void(path.replaceWith(t.ifStatement(test, node.consequent)));

        path.replaceWith(node.alternate ?
            t.ifStatement(t.unaryExpression("!", test), node.alternate) :
            t.expressionStatement(test));
    }

    return { name, visitor: { IfStatement } };
};

function evaluate(t, node)
{
    if (t.isBooleanLiteral(node) ||
        t.isStringLiteral(node) ||
        t.isNumericLiteral(node))
        return Pure({ value: !!node.value });

    if (t.isUnaryExpression(node))
        return  node.operator === "!" ?
                not(t, node) :
                Impure({ node, value: Unknown });

    if (t.isLogicalExpression(node))
    {
        const { operator } = node;

        return  operator === "&&" ? and(t, node) :
                operator === "||" ? or(t, node) :
                Impure({ node, value: Unknown });
    }

    return Impure({ node, value: Unknown });
}

function and(t, node)
{
    const { left, right } = node;
    const lhs = evaluate(t, left);

    // P/F && P/T      => P/F
    // P/F && P/F      => P/F
    // P/F && I/T/n    => P/F
    // P/F && I/F/n    => P/F
    // P/F && I/U/n    => P/F
    // I/F/n && P/T    => I/F/n
    // I/F/n && P/F    => I/F/n
    // I/F/n && I/T/n2 => I/F/n
    // I/F/n && I/F/n2 => I/F/n
    // I/F/n && I/U/n2 => I/F/n
    if (lhs.value === false)
        return lhs;

    const lhsPure = is(Pure, lhs);
    const rhs = evaluate(t, right);

    // P/T && P/T      => P/T
    // P/T && P/F      => P/F
    // P/T && I/T/n    => I/T/n
    // P/T && I/F/n    => I/F/n
    // P/T && I/U/n    => I/U/n
    if (left.value === true && lhsPure)
        return rhs;

    const rhsPure = is(Pure, rhs);

    // I/F/n && P/T      => I/F/n
    // I/F/n && P/F      => I/F/n
    // I/U/n && P/F      => I/F/n
    // I/U/n && P/T      => I/U/n
    if (rhsPure)
    {
        const value =   lhs.value === false ||
                        rhs.value === false ?
                        false :
                        Unknown;

        return Impure({ value, node: lhs.node });
    }

    const newNode =
        lhs.node === left && rhs.node === right ?
            node :
            t.logicalExpression("&&", lhs.node, rhs.node);

    // I/F/n && I/T/n2   => I/F/{ n || n2 }
    // I/F/n && I/F/n2   => I/F/{ n || n2 }
    // I/F/n && I/U/n2   => I/F/{ n || n2 }
    // I/U/n && I/F/n2   => I/F/{ n || n2 }

    // I/U/n && I/T/n2   => I/U/{ n || n2 }
    // I/U/n && I/U/n2   => I/U/{ n || n2 }
    const value =
        lhs.value === false ||
        rhs.value === false ?
        false :
        Unknown;

    return Impure({ value, node: newNode });
}

function or(t, node)
{
    const { left, right } = node;
    const lhs = evaluate(t, left);

    // P/T || P/T      => P/T
    // P/T || P/F      => P/T
    // P/T || I/T/n    => P/T
    // P/T || I/F/n    => P/T
    // P/T || I/U/n    => P/T
    // I/T/n || P/T    => I/T/n
    // I/T/n || P/F    => I/T/n
    // I/T/n || I/T/n2 => I/T/n
    // I/T/n || I/F/n2 => I/T/n
    // I/T/n || I/U/n2 => I/T/n
    if (lhs.value === true)
        return lhs;

    const lhsPure = is(Pure, lhs);
    const rhs = evaluate(t, right);

    // P/F || P/T      => P/T
    // P/F || P/F      => P/F
    // P/F || I/T/n    => I/T/n
    // P/F || I/F/n    => I/F/n
    // P/F || I/U/n    => I/U/n
    if (lhs.value === false && lhsPure)
        return rhs;

    const rhsPure = is(Pure, rhs);

    // I/F/n || P/F      => I/F/n
    // I/F/n || P/T      => I/T/n
    // I/U/n || P/T      => I/T/n
    // I/U/n || P/F      => I/U/n
    if (rhsPure)
        return rhs.value === true ?
            lhs :
            Impure({ value: true, node: lhs.node });

    const newNode =
        lhs.node === left && rhs.node === right ?
            node :
            t.logicalExpression("||", lhs.node, rhs.node);

    // I/U/n || I/T/n2   => I/T/{ n || n2 }
    // I/F/n || I/T/n2   => I/T/{ n || n2 }
    if (rhs.value === true)
        return Impure({ value: true, node: newNode });

    // I/F/n || I/F/n2   => I/F/{ n || n2 }
    // I/U/n || I/F/n2   => I/U/{ n || n2 }
    // I/U/n || I/U/n2   => I/U/{ n || n2 }
    // I/F/n || I/U/n2   => I/U/{ n || n2 }
    const value =
        lhs.value === false &&
        rhs.value === false ?
        false :
        Unknown;

    return Impure({ value, node: newNode });
}

function not(t, node)
{
    const { argument } = node;
    const evaluation = evaluate(t, argument);
    const { value } = evaluation;
    const inverted = value === Unknown ? Unknown : !value;
    
    if (is(Pure, evaluation))
        return Pure({ value: inverted });

    const newNode = evaluation.node === argument ?
        node :
        t.unaryExpression("!", evaluation.node);

    return Impure({ value: inverted, node: newNode });
}
