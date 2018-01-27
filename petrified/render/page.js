const { basename, extname } = require("path");
const transforms = [require("./markdown"), require("./react")];


module.exports = function page({ source, ...rest })
{
    const extension = extname(source);
    const transform = transforms.find(
        ({ extensions }) => extensions.has(extension.substr(1)));

    if (!transform)
        throw new Error(`Can't render ${basename(source)}`);

    return <transform { ...{ source, ...rest } } />;
}

module.exports.match = "**/*.(" + transforms
    .map(transform => Array.from(transform.extensions))
    .map(extensions => extensions.join("|"))
    .join("|") + ")"

