const { loadOptions, transformSync, transformFromAstSync } =
    require("@babel/core");
const reduce = require("@isomorphic/reduce-javascript");
const metadataOptions = loadOptions(
{
    plugins:
    [
        require("./plugins/babel-plugin-metadata"),
        require("./plugins/babel-plugin-dependencies")
    ],
    sourceMaps: true
});

const getResolvedOptions = require("./get-resolved-options");
const moduleWrap = require("./module-wrap");


module.exports = function transform(filename, contents, babelOptions)
{
    const options = { ...loadOptions(babelOptions), ast: true, code: false };
    const { ast } = transformSync(contents, options);
    const reduced = { ...ast, program: reduce(ast.program) };
    const { code, map, metadata } = transformFromAstSync(reduced, contents,
    {
        ...metadataOptions,
        filename
    });
    const mapComment =
        "//"+map.sources+"\n"+
        "//# sourceMappingURL=data:application/json;charset=utf-8;base64," +
        Buffer.from(JSON.stringify(map), "utf-8").toString("base64");
    const codeWithMap = `${code}\n${mapComment}\n`;
    const wrapped = moduleWrap(metadata.globals, codeWithMap);

    return { contents: wrapped, metadata };
}
