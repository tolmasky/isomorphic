const { OrderedSet, Set } = require("@algebraic/collections");


module.exports = function reduce(children, cyclic = false)
{
    return function reduce(f, accum, node)
    {
        return cyclic ?
            reduce_(
                children, 
                ([visited, accum], node) =>
                    (console.log(node + " " + visited.has(node) + " " + visited.size + " " + visited), visited.has(node) ?
                        [visited, accum] :
                        [visited.add(node), f(accum, node)]),
                [Set(Object)(), accum],
                node)[1] :
            reduce_(children, f, accum, node)  
    }
}

module.exports.cyclic = function reduceCyclic(children, f, accum, node)
{
    return reduceCyclic_(children, Set(Object)([node]), f, accum, node)[1];
}


function reduceCyclic_(children, visited, f, accum, node)
{
    const unvisited = OrderedSet(Object)(children(node)).subtract(visited);
    const outVisited = visited.union(unvisited);

    return unvisited.reduce(
        ([visited, accum], node) =>
            reduceCyclic_(children, visited, f, accum, node),
        [outVisited, f(accum, node)]);
}

function reduce_(children, f, accum, node)
{console.log("WILL ITERATE OVER " + children(node));
    return children(node).reduce(
        (accum, node) => reduce_(children, f, accum, node),
        f(accum, node));
}
