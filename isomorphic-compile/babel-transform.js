
const { basename, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const babylon = require("babylon");
const { transformFromAst } = require("babel-core");
const File = require("babel-core/lib/transformation/file").default;
const uglify = require("uglify-js");

const getMerkleChecksum = require("./get-merkle-checksum");


module.exports = function transform({ cache, path, options, wrap })
{
    const contents = readFileSync(path, "utf-8");
    const checksum = getMerkleChecksum({ contents, path, options })
        .replace(/\//g, "_");
    const contentsCachePath = getContentsCachePath(cache, checksum, path);
    const metadataCachePath = getMetadataCachePath(cache, checksum, path);

    if (existsSync(contentsCachePath))
    {
        const include = contentsCachePath;
        const metadata = getCachedMetadata(metadataCachePath);

        return { include, path, ...metadata };
    }

    const caches = { contentsCachePath, metadataCachePath };

    return  <transformAST { ...{ ...caches, contents, path, options, wrap } }>
                <parse contents = { contents } >
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

function transformAST({ children:[AST], contentsCachePath, metadataCachePath,
    contents, path, options, wrap })
{
    const transformed = transformFromAst(AST, contents, options.babel);
    const transformedContents = transformed.code;
    // newline necessary in case the file ends with a line-comment.
    const wrappedContents = wrap ?
        "(function (exports, require, module, __filename, __dirname) {" +
        transformedContents + "\n})" :
        transformedContents;
    const minifiedContents = options.minify ?
        minify(wrappedContents, { compress: { side_effects: false } }) :
        wrappedContents;

    writeFileSync(contentsCachePath, minifiedContents, "utf-8");

    const metadata = transformed.metadata.isomorphic ||
        { dependencies: new Set(), entrypoints: new Set(), assets: new Set() };

    cacheMetadata(metadataCachePath, metadata);

    return { include: contentsCachePath, path, ...metadata };
}

function minify(input, options)
{
    const { code, error } = uglify.minify(input, options);

    if (error)
        throw error;

    return code;
}

function cacheMetadata(aPath, metadata)
{
    if (!metadata)
        return;

    if (metadata.dependencies.size <= 0 &&
        metadata.entrypoints.size <= 0)
        return;

    const dependencies = Array.from(metadata.dependencies);
    const entrypoints = Array.from(metadata.entrypoints);

    const asArrays = { dependencies, entrypoints };

    writeFileSync(aPath, JSON.stringify(asArrays, null, 2), "utf-8");
}

function getCachedMetadata(aPath)
{
    if (!existsSync(aPath))
        return { dependencies: new Set() };

    const metadata = JSON.parse(readFileSync(aPath, "utf-8"));
    const dependencies = new Set(metadata.dependencies);
    const entrypoints = new Set(metadata.entrypoints);

    return { dependencies, entrypoints };
}

function getContentsCachePath(cache, checksum, filename)
{
    return getCachePath(cache, checksum, filename, "contents", "js");
}

function getMetadataCachePath(cache, checksum, filename)
{
    return getCachePath(cache, checksum, filename, "metadata", ".json");
}

function getCachePath(cache, checksum, filename, type, extname)
{
    return join(cache, `${basename(filename)}-${type}-${checksum}.${extname}`);
}
