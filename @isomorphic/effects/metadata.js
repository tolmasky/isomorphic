const { base, getArguments: attrs } = require("generic-jsx");
const MetadataSymbol = Symbol("metadata-symbol");
const effect = require("./effect");
const getMerkleChecksum = require("isomorphic-runtime/get-merkle-checksum");


module.exports = metadata;

function metadata(node, previous)
{
    return  node[MetadataSymbol] ||
            (node[MetadataSymbol] = getComputedMetadata(node));
}

function getComputedMetadata(node)
{
    if (base(node) === effect)
    {
        const { start } = attrs(node);
        const uuid = getMerkleChecksum(node);

        return { effects: { [uuid]: { start } }, uuid };
    }

    const { children } = attrs(node);
    const entry = (start, index) => ({ start, indexes:[index] });
    const effects = children
        .map(child => metadata(child))
        .reduce((union, { effects }, index) =>
            Object.keys(effects).reduce(function (union, key)
            {
                if (!union[key])
                    union[key] = entry(effects[key].start, index);
                else
                    union[key].indexes.push(index);

                return union;
            }, union),
            Object.create(null));

    const references = children
        .map(child => [attrs(child).ref, child])
        .filter(([ref, child]) => ref !== void 0)
        .reduce((children, [ref, child]) =>
            Object.assign(children, { [ref]: child }),
            Object.create(null));

    return { effects, references };
}
