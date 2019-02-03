const t = require("@babel/types");
const reduce = require(".");
const { Value, Unknown } = require("./value");


module.exports.Node = function Node(node)
{
    const children = t.VISITOR_KEYS[node.type]
        .map(field => [field, node[field]]);
    const evaluated = children
        .map(([field, child]) => [field, child && reduce(child)]);
    const modified = evaluated
        .filter(([, child], index) => child !== children[index][1]);
    const newNode = modified.length === 0 ?
        node :
        modified.reduce((accum, [key, value]) =>
            (accum[key] = value, accum), { ...node });

    return Value.on(newNode, Unknown);
}
