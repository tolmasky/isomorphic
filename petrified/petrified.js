const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const page = require("./transform/page");
const post = require("./transform/post");
const getComponents = require("./components");

const express = require("express");
    

module.exports = function ({ source, destination, cache })
{
    const components = getComponents({ source });

    require("child_process").execSync(`rm -rf ${source}/_cache`);

    runtime([
        <posts { ...{ components, source:`${source}/posts`, destination, cache } }/>,
        <pages { ...{ components, source:`${source}/pages`, destination, cache } }/>
    ]);

    express()
        .use("/", express.static(destination))
        .listen(4500);
}

function pages({ components, source, destination, cache })
{
    const options = { components };
    const transforms = [{ match: page.match, transform: page, options }];

    return <tree { ...{ source, transforms, destination, cache } }/>;
}

function posts({ components, source, destination, cache })
{
    const options = { components };
    const transforms = [{ match:`${source}/*`, transform: post, options }];
    
    return <tree { ...{ source, transforms, destination, cache } }/>;
}
