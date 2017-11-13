
const { basename, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const babylon = require("babylon");
const { transformFromAst } = require("babel-core");
const File = require("babel-core/lib/transformation/file").default;

const minify = require("./uglify-minify");

const GlobalPreamble = "(function (global, process){return ";
const GlobalPostamble = "\n})";
const ModulePreamble = "function (exports, require, module, __filename, __dirname) {\n";
const ModulePostamble = "\n}";

const DefaultMetadata =
{
    dependencies: EmptySet,
    entrypoints: EmptySet,
    assets: EmptySet,
    globals: []
};

Error.stackTraceLimit = 1000;


module.exports = function transform({ path, contents, options, wrap })
{
    return  <transformAST { ...{ contents, options, wrap } }>
                <parse { ...{ contents, path } }>
                    <parserOptions options = { options.babel } />
                </parse>
            </transformAST>
}

// It's not worth it to cache these on the filesystem for now. It takes too long
// to just read and parse the JSON. Perhaps if we could stirp out the tokens, or
// only cache if its under X KB. But we still get the benefit of caching it in
// memory.
function parse({ children:[options], contents })
{
    return babylon.parse(contents, options);
}

function parserOptions({ options })
{
    const { parserOpts, opts } = new File(options);

    // Oh boy...
    return Object.assign(parserOpts, opts.parserOpts);
}

function transformAST({ children:[AST], contents, options, wrap })
{
    const transformed = transformFromAst(AST, contents, options.babel);
    const metadata = transformed.metadata.isomorphic || DefaultMetadata;
    const output = pipe([wrap && moduleWrap, options.minify && minify],
        transformed.code);

    return { contents: output, metadata };
}

function pipe(items, input)
{
    return items.reduce((input, item) =>
        item ? item(input) : input, input);
}

function moduleWrap(contents)
{
    return GlobalPreamble + ModulePreamble +
        contents +
        ModulePostamble + GlobalPostamble;
}

const EmptySet =
{
    size: 0,
    [Symbol.iterator]: function *() { },
    add: function() { throw new TypeError("Cannot add to an EmptySet") }
}
