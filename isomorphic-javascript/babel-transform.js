
const { basename, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const babylon = require("babylon");
const { transformFromAst, transform } = require("babel-core");
const File = require("babel-core/lib/transformation/file").default;

const minify = require("./uglify-minify");
const moduleWrap = require("./module-wrap");
const eliminate = require("./dead-code-elimination");


const DefaultMetadata =
{
    dependencies: new Set(),
    entrypoints: new Set(),
    assets: new Set(),
    globals: { }
};

Error.stackTraceLimit = 1000;


module.exports = function transform({ path, contents, options, wrap })
{
    return transformAST({ contents, options, path, wrap, children:
    [
        parse({ contents, path, children:
        [
            parserOptions({ options: options.babel })
        ]})
    ]});

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
function parse({ children:[options], contents, path })
{
    return babylon.parse(contents, options);
/*var d = new Date();
    var x =  babylon.parse(contents, options);
    console.log(path + ": " + (new Date() - d));
    return x;*/  
}

function parserOptions({ options })
{
    const { parserOpts, opts } = new File(options);

    // Oh boy...
    return Object.assign(parserOpts, opts.parserOpts);
}

function transformAST({ children:[AST], contents, path, options, wrap })
{
    var eliminated = eliminate(AST, contents).ast;
    var transformed = transformFromAst(eliminated, null, options.babel);
    var metadata = transformed.metadata.isomorphic || DefaultMetadata;
    var output = pipe([
        wrap && moduleWrap(metadata.globals),
        options.minify && minify], transformed.code);

    return { contents: output, metadata };
}

function pipe(items, input)
{
    return items.reduce((input, item) =>
        item ? item(input) : input, input);
}


