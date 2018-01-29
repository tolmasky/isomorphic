const { basename, dirname, extname } = require("path");
const transforms = [require("./markdown"), require("./react")];


module.exports = function format({ source, destination, ...rest })
{
    const extension = extname(source);
    const transform = transforms.find(
        ({ extensions }) => extensions.has(extension.substr(1)));

    if (!transform)
        throw new Error(`Can't render ${basename(source)}`);

    return <transform { ...{ source, destination, ...rest } } />;
}

module.exports.extensions = new Set([].concat(...transforms
    .map(transform => Array.from(transform.extensions))));

