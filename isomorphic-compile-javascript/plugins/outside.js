const t = require("@babel/types");
const { data, union, boolean, is } = require("@algebraic/type");

const Unknown = data `Unknown` ();
const Pure = data `Pure` (
    value => boolean );
const Impure = data `Impure` (
    value   => union `Value` (boolean, Unknown),
    node    => Object );

const handlers = { };

function evaluate(node)
{
    return (handlers[node.type] || handlers.Node)(node);
}

handlers.Node = function Node(node)
{
    const children = t.VISITOR_KEYS[node.type]
        .map(field => [field, node[field]]);
    const evaluated = children
        .map(([field, child]) => [field, evaluate(t, child)]);
    const modified = children
        .filter(([, child], index) => child === evaluated[index][1]);
    const value = Unknown;

    if (modified.length === 0)
        return Impure({ node, value });

    const diff = modified
        .reduce((accum, [key, value]) => (accum[key] = value, accum), { });

    return Impure({ node: { ...node, ...diff }, value });
}

handlers.IfStatement = function IfStatement(t, node)
{
    const evaluation = evaluate(t, node.test);
    const { value } = evaluation;

    if (is(Pure, evaluation))
        return value ? node.consequent : node.alternate;

    const { node: test } = evaluation;

    if (value === Unknown)
        return test === node.test ?
            node :
            t.ifStatement(test, node.consequent, node.alternate);

    if (!!value)
        return t.ifStatement(test, node.consequent);

    return node.alternate ?
        t.ifStatement(t.unaryExpression("!", test), node.alternate) :
        t.expressionStatement(test);
}

function eliminate(node)
{
    
}



