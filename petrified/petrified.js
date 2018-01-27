const runtime = require("isomorphic-runtime");
const tree = require("isomorphic-tree");

const page = require("./render/page");
const components = require("./components");
    

module.exports = function ({ source, destination, cache })
{
    const options = { components: components({ source }) };
    const transforms = [{ match: page.match, transform: page, options }];
    
    console.log(options);

    const filename = `${source}/posts/2015-09-10-time-traveling-in-node-js-notebooks/2015-09-10-time-traveling-in-node-js-notebooks.md`;
    const output = `${destination}/BLAH.html`;

    return runtime(<tree source = { filename } cache = { cache } transforms = { transforms } destination = { output } />);
}
