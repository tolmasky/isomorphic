const { dirname } = require("path");
const { loadOptions, transformSync } = require("@babel/core");
const reduce = require("@isomorphic/reduce-javascript");
const generate = require("@babel/generator").default;
const moduleWrap = require("./module-wrap");
const getDependencies = require("./get-dependencies");


module.exports = function transform(filename, contents, babelOptions)
{
    const options =
    {
        ...loadOptions(babelOptions),
        filename,
        sourceRoot: dirname(filename),
        ast: true,
        code: false
    };
    const { ast } = transformSync(contents, options);
    const reduced = reduce(ast.program);
    const [metadata, modified] = getDependencies(reduced);
    const { code, map } = generate({ ...ast, program: reduced },
    {
        sourceMaps: true,
        sourceFileName: filename
    }, contents);
    const wrapped = moduleWrap(metadata.free, code);

    return { contents: wrapped, sourceMap: map, metadata };
}
