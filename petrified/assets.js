const tree = require("isomorphic-tree");
const extract = require("isomorphic-runtime/extract");
const getFileChecksum = require("isomorphic-runtime/get-file-checksum");

const page = require("./transform/page");


module.exports = function assets({ source, destination, ...rest })
{
    const exclude = `${source}/${page.match}`;
    const options = { destination };
    const transforms = [{ match: "**/*", transform: asset, options, contents: false }];

    return  <toAssetMap>
                <tree { ...{ source, destination, transforms, exclude } } />;
            </toAssetMap>
}

function toAssetMap({ children })
{
    return children
        .map(child => child && child.metadata)
        .filter(metadata => metadata && metadata.asset)
        .reduce((assets, asset) =>
            Object.assign(assets, { [asset.destination]: asset }),
            Object.create(null));
}

function asset({ source, destination, options })
{
    const checksum = getFileChecksum(source);
    const metadata = { checksum, destination: destination.substr(options.destination.length), asset: true };

    return { include: source, metadata };
}
