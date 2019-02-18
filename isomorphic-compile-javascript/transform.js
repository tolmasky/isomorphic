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


module.exports = function transform(filename, contents, babelOptions, minify)
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
    const [modified, metadata] = getDependencies3(Globals, reduced);
    const unminified = generate({ ...ast, program: modified },
    {
        sourceMaps: true,
        sourceFileName: filename
    }, contents);
    const wrapped = moduleWrap(metadata.globals, unminified.code);
    const { code, map } = minify ?
        terserMinify(filename, wrapped, unminified.map) :
        { code:wrapped, map: unminified.map };

    return { contents: code, sourceMap: map, metadata };
}

const terserMinify = (function()
{
    const { minify } = require("terser");

    // We'd like to get rid of the *trailing* semicolon for concatenation
    // purposes, but our only option is getting rid of all unecessary
    // semicolons. https://github.com/mishoo/UglifyJS2/issues/2477
    const output = { semicolons: false };
    const compress = { expression: true };

    return function (filename, contents, previousSourceMap)
    {
        const { code, map } = minify({ [filename]: contents },
        {
            output,
            compress,
            sourceMap: { content: previousSourceMap }
        });

        // They *only* give this to us as a string.
        return { code, map: JSON.parse(map) };
    };
})();
