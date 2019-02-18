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
    const wrapped = moduleWrap(metadata.globals, modified);
    const unminified = generate({ ...ast, program: wrapped },
    {
        sourceMaps: true,
        sourceFileName: filename
    }, contents);

    // FIXME: There isn't a clear way to have @babel/generator omit the trailing
    // semicolon. If we pass just the expression, then source-maps seem to
    // break.
    //
    // Babel Bug: https://github.com/babel/babel/issues/9540
    unminified.code = unminified.code.slice(0, -1);

    const { code, map } = minify ?
        terserMinify(filename, unminified) : unminified;

    return { contents: code, sourceMap: map, metadata };
}

const terserMinify = (function()
{
    const { minify } = require("terser");

    // We'd like to get rid of the *trailing* semicolon for concatenation
    // purposes, but our only option is getting rid of all unecessary
    // semicolons.
    //
    // Terser Bug: https://github.com/terser-js/terser/issues/277
    const output = { semicolons: false };
    const compress = { expression: true };

    return function (filename, original)
    {
        const { code, map } = minify({ [filename]: original.code },
        {
            output,
            compress,
            sourceMap: { content: original.map }
        });

        // They *only* give this to us as a string, so we have to parse it
        // as our client expects an object. If Terser is against fixing this,
        // we might consider changing our expectation to be a string, or doing
        // a similar hack to Parcel:
        // https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/transforms/terser.js#L23
        //
        // Terser Bug: https://github.com/terser-js/terser/issues/278
        return { code, map: JSON.parse(map) };
    };
})();
