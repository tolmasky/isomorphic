const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const page = require("./transform/page");
const post = require("./transform/post");
const components = require("./components");

const express = require("express");
    

module.exports = function ({ source, destination, cache })
{
    const options = { components: components({ source }) };
    const transforms = [{ match:`${source}/posts/*`, transform: post, options }];

    require("child_process").execSync(`rm -rf ${source}/_cache`);

    console.log(transforms);

runtime([
        <tree { ...{ source: `${source}/posts`, transforms, destination, cache } }/>,
        <tree { ...{ source: `${source}/pages`, transforms, destination, cache } }/>,
    ]);
    
        express()
        .use("/", express.static(destination))
        .listen(4500);
}
