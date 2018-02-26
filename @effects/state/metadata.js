const { base, getArguments: attrs } = require("generic-jsx");
const MetadataSymbol = Symbol("metadata-symbol");
const Effect = require("./effect");
const getMerkleChecksum = require("isomorphic-runtime/get-merkle-checksum");
const { type } = require("./state");


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
    if (node[type] === Effect)
    {
        const { start, args } = node;
        const uuid = getMerkleChecksum(node);

        return { effects: { [uuid]: { start, args } }, uuid };
    }

    const { children } = node;
    const entry = (effect, ref) => ({ ...effect, keys:[ref] });
    
    const effects = Object.keys(children)
        .map(key => [key, metadata(children[key])])
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
