const { basename, dirname, extname } = require("path");
const format = require("./format");


module.exports = function page({ source, destination, ...rest })
{
    const extension = extname(source);
    const name = basename(source, extension);
    const type = extname(name);
    const override = type === ".page" ?
        `${dirname(destination)}/${basename(name, type)}/index.html` :
        `${dirname(destination)}/${name}`;

    return  <redirect destination = { override }>
                <format { ...{ source, destination, ...rest } } />
            </redirect>
}

function redirect({ children:[result], destination })
{
    return { ...result, metadata: { ...result.metadata, destination } };
}

module.exports.match = "**/*.*.(" + Array.from(format.extensions).join("|") + ")";

