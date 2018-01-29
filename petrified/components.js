const { basename, extname } = require("path");
const fs = require("sf-fs");

const is =
{
    package: path => fs.tstat(`${path}/package.json`) === "file",
    module: path => extname(path) === ".js" || is.package(path)
};
const alternates = invert(
{
    Image: ["img"],
    Code: ["code"],
    CodeBlock: ["code-block"]
});

module.exports = function components({ source })
{
    return fs.readdir(`${source}/components`)
        .filter(is.module)
        .map(path => [basename(path), path])
        .map(([name, path]) => ({ [name]: () => require(path) }))
        .reduce((components, component) =>
            Object.assign(components, component),
            { markdown: markdown({ source }) });
}

function markdown({ source })
{
    const dirname = `${source}/components/markdown`;

    if (!fs.tstat(dirname))
        return Object.create(null);

    return fs.readdir(dirname)
        .filter(is.module)
        .map(path => [basename(path, extname(path)), require(path)])
        .map(([name, component]) => [alternates[name], component])
        .filter(([name]) => !!name)
        .reduce((components, [name, component]) =>
            Object.assign(components, { [name]: component }),
            Object.create(null));
}

function invert(object)
{
    return Object.keys(object)
        .map(from => [from, object[from]])
        .reduce((inverted, [from, tos]) =>
            tos.reduce((inverted, to) =>
                Object.assign(inverted, { [to]: from }),
                inverted),
            Object.create(null));
}
