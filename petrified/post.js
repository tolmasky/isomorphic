const tree = require("isomorphic-tree");
const { basename, extname } = require("path");
const fs = require("sf-fs");

const same = { name: name => path => basename(path, extname(path)) === name };
const FILENAME_FORMAT = /^(\d{4})-(\d{2})-(\d{2})-([^\.]*)/;
const render = require.resolve("./render/page");


module.exports = function post({ source, destination, cache })
{
    const filename = basename(source);
    const parsed = filename.match(FILENAME_FORMAT);

    if (parsed === null)
        throw new Error(`Post ${filename} must have the format YYYY-MM-DD-name.`);

    const [_, year, month, day, name] = parsed;
    const directory = `${destination}/${year}/${month}/${day}/${name}`;

    mkdirp(directory);

    const isDirectory = fs.tstat(path) === "directory";
    const input = isDirectory ? fs.readdir(source).find(same.name(filename)) : source;
    const renderer = extname(input) === ".md" ? require.resolve("./render/markdown") : require.resolve("./render/react");
    const transforms = [{ match: input, transform: render }];

    return <tree { ...{ source, destination: directory, cache, transforms } } />;
}




