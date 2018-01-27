const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");
const { resolve } = require;

const transforms = [
    { "match": "**/*.md", "transform": resolve("./render/markdown") },
    { "match": "**/*.js", "transform": resolve("./render/react") }
];
    

module.exports = function ({ source, destination, cache })
{
    return runtime(<tree { ...{ source, destination, cache, transforms } } />);
}
