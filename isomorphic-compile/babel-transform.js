
const { basename, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const babylon = require("babylon");
const { transformFromAst } = require("babel-core");
const File = require("babel-core/lib/transformation/file").default;

const fsCache = require("./fs-cache");
Error.stackTraceLimit = 1000;


module.exports = function fsCachedTransfrom({ cache, ...rest })
{
    return <fsCache { ... { cache, transform: <transform { ...rest } /> } } />;
}

function transform({ path, contents, options, removeTrailingSemicolon })
{
    return  <transformAST { ...{ contents, options, removeTrailingSemicolon } }>
                <parse contents = { contents } path = { path }>
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

function transformAST({ children:[AST], contents, options, removeTrailingSemicolon })
{
    const transformed = transformFromAst(AST, contents, options.babel);
    const transformedContents = transformed.code;
    const modifiedContents = removeTrailingSemicolon ?
        transformedContents.substr(0, transformedContents.length - 1) :
        transformedContents;
        
    const metadata = transformed.metadata.isomorphic ||
        { dependencies: new Set(), entrypoints: new Set(), assets: new Set() };

    return { contents: modifiedContents, metadata };
}
