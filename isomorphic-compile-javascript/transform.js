const { dirname } = require("path");
const { loadOptions, transformSync } = require("@babel/core");
const reduce = require("@isomorphic/reduce-javascript");
const generate = require("@babel/generator").default;
const moduleWrap = require("./module-wrap");
const getDependencies3 = require("./get-dependencies-3");
const Globals =
[
    "require", "exports", "module", "__filename", "__dirname",
    "process", "Buffer"
];


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
    const start = Date.now();
    const [modified, metadata] = getDependencies3(Globals, reduced);
    const { code, map } = generate({ ...ast, program: modified },
    {
        sourceMaps: true,
        sourceFileName: filename
    }, contents);
    const wrapped = moduleWrap(metadata.globals, code);

    return { contents: wrapped, sourceMap: map, metadata };
}
