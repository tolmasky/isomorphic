const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const assets = require("./assets");

const page = require("./transform/page");
const post = require("./transform/post");
const redirects = require("./redirects");
const getComponents = require("./components");

const express = require("express");
Error.stackTraceLimit = 10000;

module.exports = function ({ site, drafts = false, source, destination, cache })
{
    const components = getComponents({ source });
    const common = { site, components, destination, cache };

    require("child_process").execSync(`rm -rf ${source}/_cache`);

    runtime(
        <redirects { ...common }>
            <pages source = { `${source}/pages` } { ...common }>
                <metadata>
                    <posts source = { `${source}/posts` } { ...common }>
                        <assets source = { `${source}/pages` } { ...common } />
                    </posts>
                    { drafts && <posts source = { `${source}/drafts` } { ...common }/> }
                </metadata>
            </pages>
        </redirects>);
}

function pages({ site, components, source, destination, cache, children })
{
    const options = { components, props: { site, posts: children } };
    const transforms = [{ match: page.match, transform: page, options }];

    return [
        <tree { ...{ source, transforms, destination, cache } }/>,
        children
    ];
}

function metadata({ children })
{
    return children
        .filter(child => child)
        .map(child => child.frontmatter || child.metadata);
}

function posts({ site, components, source, destination, cache, children })
{console.log(children.length);
    const options = { components, props: { site }, assets:children[0] || { } };
    const transforms = [{ match: `${source}/*`, transform: post, directories: true, options }];
    
    return <tree { ...{ source, transforms, destination, cache } }/>;
}
