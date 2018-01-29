const { basename, dirname, extname } = require("path");
const format = require("./format");


module.exports = function page({ source, destination, ...rest })
{
    const extension = extname(source);
    const name = basename(source, extension);
    const type = extname(name);
    const override = type === ".html" ?
        `${dirname(destination)}/${name}` :
        `${dirname(destination)}/${basename(name, type)}/index.html`;

    return  <redirect destination = { override }>
                <format { ...{ source, destination, ...rest } } />
            </redirect>
}

function redirect({ children:[result], destination })
{
    return { ...result, metadata: { ...result.metadata, destination } };
}

module.exports.match = "**/*.(page|html).(" + Array.from(format.extensions).join("|") + ")";

