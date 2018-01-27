const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const transforms = [
    { "match": "**/*.md", "transform": "./render/markdown" },
    { "match": "**/*.js", "transform": "./render/react" }
];


module.exports = function ({ source, destination, cache })
{
    return runtime(<tree { ...{ source, destination, cache, transforms } } />);
}
