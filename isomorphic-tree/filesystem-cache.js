
const { basename, join } = require("path");
const { existsSync, readFileSync, writeFileSync } = require("fs");

const getMerkleChecksum = require("isomorphic-runtime/get-merkle-checksum");
const { getArguments } = require("generic-jsx");


module.exports = function fsCache({ cache, transform })
{
    const { source } = getArguments(transform);
    const contents = readFileSync(source, "utf-8");
    const checksum = getMerkleChecksum({ contents, transform })
        .replace(/\//g, "_");
    const contentsCachePath = getContentsCachePath(cache, checksum, source);
    const metadataCachePath = getMetadataCachePath(cache, checksum, source);

    if (existsSync(contentsCachePath))
    {
        const include = contentsCachePath;
        const metadata = getCachedMetadata(metadataCachePath);

        return { include, source, ...metadata };
    }

    return  <fsWrite  { ...{ contentsCachePath, metadataCachePath, source } } >
                <transform { ...{ contents } } />
            </fsWrite>
}

function fsWrite({ children:[output], ...rest })
{
    const { contentsCachePath, metadataCachePath, source } = rest;

    writeFileSync(contentsCachePath, output.contents, "utf-8");
    cacheMetadata(metadataCachePath, output.metadata);

    return { include: contentsCachePath, source, ...output.metadata };
}

function cacheMetadata(aPath, metadata)
{
    if (!metadata)
        return;

    if ((!metadata.dependencies || metadata.dependencies.size <= 0) &&
        (!metadata.entrypoints || metadata.entrypoints.size <= 0) &&
        (!metadata.assets || metadata.assets.size <= 0) &&
        !metadata.destination &&
        (!metadata.globals || Object.keys(metadata.globals).length <= 0))
        return;

    writeFileSync(aPath, JSON.stringify(metadata, function (key, value)
    {
        if (value instanceof Set)
            return Array.from(value);

        return value;
    }, 2), "utf-8");
}

function getCachedMetadata(aPath)
{
    if (!existsSync(aPath))
        return { };

    return JSON.parse(readFileSync(aPath, "utf-8"));
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
