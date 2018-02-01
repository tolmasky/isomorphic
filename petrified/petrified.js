const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const page = require("./transform/page");
const post = require("./transform/post");
const getComponents = require("./components");

const express = require("express");
    

module.exports = function ({ config, drafts = false, source, destination, cache })
{
    const components = getComponents({ source });
    const common = { config, components, destination, cache };

    require("child_process").execSync(`rm -rf ${source}/_cache`);

    runtime(
        <pages source = { `${source}/pages` } { ...common }>
            <metadata>
                <posts source = { `${source}/posts` } { ...common }/>
                { drafts && <posts source = { `${source}/drafts` } { ...common }/> }
            </metadata>
        </pages>);
}

function pages({ config, components, source, destination, cache, children })
{
    const options = { components, props: { config, posts: children } };
    const transforms = [{ match: page.match, transform: page, options }];

    return <tree { ...{ source, transforms, destination, cache } }/>;
}

function metadata({ children })
{
    return children
        .filter(child => child)
        .map(child => child.frontmatter);
}

function posts({ config, components, source, destination, cache })
{
    const options = { components, props: { config } };
    const transforms = [{ match: `${source}/*`, transform: post, options }];
    
    return <tree { ...{ source, transforms, destination, cache } }/>;
}
