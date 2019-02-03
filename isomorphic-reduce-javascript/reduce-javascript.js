const { isArray } = Array;


module.exports = function reduce(node)
{
    if (isArray(node))
        return node.map(reduce);

    return (handlers[node.type] || handlers.Node)(node);
}

const handlers =
{
    ...require("./node"),
    ...require("./unary-expression"),
    ...require("./binary-expression"),
    ...require("./logical-expression"),
    ...require("./literals"),
    ...require("./if-statement")
};
