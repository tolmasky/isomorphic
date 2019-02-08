const { loadOptions, transformSync, transformFromAstSync } =
    require("@babel/core");
const reduce = require("@isomorphic/reduce-javascript");
const metadataOptions = loadOptions(
{
    plugins:
    [
        require("./plugins/babel-plugin-metadata"),
        require("./plugins/babel-plugin-dependencies")
    ]
});

const getResolvedOptions = require("./get-resolved-options");
const moduleWrap = require("./module-wrap");


module.exports = function transform(contents, babelOptions)
{
    const options = { ...loadOptions(babelOptions), ast: true, code: false };
    const { ast } = transformSync(contents, options);
    const reduced = { ...ast, program: reduce(ast.program) };
    const { code, metadata } =
        transformFromAstSync(reduced, contents, metadataOptions);
    const wrapped = moduleWrap(metadata.globals, code);

    return { contents: wrapped, metadata };
}
