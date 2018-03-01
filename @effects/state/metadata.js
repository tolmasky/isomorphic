//const { base, getArguments: attrs } = require("generic-jsx");
const MetadataSymbol = Symbol("metadata-symbol");
//const Effect = require("./effect");
const getMerkleChecksum = require("isomorphic-runtime/get-merkle-checksum");


module.exports = metadata;

function metadata(node, previous)
{
    if (node[MetadataSymbol])
        return node[MetadataSymbol];

    Object.defineProperty(node, MetadataSymbol,
    {
        enumerable: false,
        value: getComputedMetadata(node)
    });
    
    return node[MetadataSymbol];
}

function getComputedMetadata(node)
{
    const Type = Object.getPrototypeOf(node).constructor;
//if (Type.name === "Object")
//    console.log(new Error().stack);
//console.log(Type+"", node);
    if (Type === require("./effect"))
    {
        const { start, args, shared } = node;
        const uuid = !shared ? (node.uuid || "unregistered") : getMerkleChecksum(node);

        return { effects: { [uuid]: { start, args } }, uuid };
    }

    const { children } = Type;
    const entry = (effect, ref) => ({ ...effect, keys:[ref] });

    const effects = Object.keys(children)
        .filter(key => !!node[key])
        .map(key => [key, metadata(node[key])])
        .reduce((union, [key, { effects }]) =>
            Object.keys(effects).reduce(function (union, uuid)
            {
                if (!union[uuid])
                    union[uuid] = entry(effects[uuid], key);
                else
                    union[uuid].keys.push(key);

                return union;
            }, union),
            Object.create(null));

    return { effects };
}
