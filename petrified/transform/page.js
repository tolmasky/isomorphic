const { basename, dirname, extname } = require("path");
const transforms = [require("./markdown"), require("./react")];


module.exports = function page({ source, destination, ...rest })
{
    const extension = extname(source);
    const transform = transforms.find(
        ({ extensions }) => extensions.has(extension.substr(1)));

    if (!transform)
        throw new Error(`Can't render ${basename(source)}`);

    const name = basename(source, extension);
    const type = extname(name);
    const override = type === ".html" ?
        `${dirname(destination)}/${name}` :
        `${dirname(destination)}/${basename(name, type)}/index.html`;

    return  <redirect destination = { override }>
                <transform { ...{ source, destination, ...rest } } />
            </redirect>
}

function redirect({ children:[result], destination })
{console.log(destination);
    return { ...result, metadata: { ...result.metadata, destination } };
}

module.exports.match = "**/*.(page|html).(" + transforms
    .map(transform => Array.from(transform.extensions))
    .map(extensions => extensions.join("|"))
    .join("|") + ")";

