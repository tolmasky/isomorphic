const { base, getArguments: attrs } = require("generic-jsx");
const MetadataSymbol = Symbol("metadata-symbol");
const Effect = require("./effect");
const getMerkleChecksum = require("isomorphic-runtime/get-merkle-checksum");
const { type } = require("./state");


module.exports = metadata;

function metadata(node, previous)
{
    return  node[MetadataSymbol] ||
            (node[MetadataSymbol] = getComputedMetadata(node));
}

function getComputedMetadata(node)
{
    if (node[type] === Effect)
    {
        const { start } = node;
        const uuid = getMerkleChecksum(start);

        return { effects: { [uuid]: { start } }, uuid };
    }

    const { children } = node;
    const entry = (start, ref) => ({ start, keys:[ref] });
    console.log(Object.keys(children));
    const effects = Object.keys(children)
        .map(key => [key, metadata(children[key])])
        .reduce((union, [key, { effects }]) =>
            Object.keys(effects).reduce(function (union, uuid)
            {
                if (!union[uuid])
                    union[uuid] = entry(effects[uuid].start, key);
                else
                    union[uuid].keys.push(key);

                return union;
            }, union),
            Object.create(null));

    return { effects };
}
