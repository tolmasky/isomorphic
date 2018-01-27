const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const page = require("./transform/page");
const post = require("./transform/post");
const components = require("./components");
    

module.exports = function ({ source, destination, cache })
{
    const options = { components: components({ source }) };
    const transforms = [{ match: page.match, transform: page, options }];

    require("child_process").execSync(`rm -rf ${source}/_cache`);

    console.log(options);

    return runtime(<post { ...{ source: `${source}/posts/2015-09-10-time-traveling-in-node-js-notebooks`, destination, cache } } options = { options } />);
    
/*
    const filename = `${source}/posts/2015-09-10-time-traveling-in-node-js-notebooks/2015-09-10-time-traveling-in-node-js-notebooks.md`;
    const output = `${destination}/BLAH.html`;

    return runtime(<tree source = { filename } cache = { cache } transforms = { transforms } destination = { output } />);*/
}
