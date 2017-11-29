

// Merely calling babel-register causes new requires to be babel-ed, and for whatever
// reason babel by default doesn't accept rest parameters, so we need to pre-require
// `isomorphic-preset`.
require("../isomorphic-preset");

// Use `isomorphic-preset` from no one.
require("babel-register")(
{
    presets: [
        ["../isomorphic-preset", { node: "4.x.x", react: false }]
    ],
    plugins: [
        require("generic-jsx/babel-plugin-transform-generic-jsx")
    ],
    cache: false // circular json errors?
});

const { join, resolve, relative } = require("path");
const build = require("./isomorphic-build");

process.env.ISOMORPHIC_DEVELOPMENT = true;

(async function ()
{
    try
    {
        const relative = path => resolve(join(__dirname, path));
        const now = require("moment")().format('MMMM Do YYYY, h.mm.ss A');
        const destination = relative(`build-products/${now}`);
    
        await build({ source: ".", destination });
    }
    catch (e)
    {
        console.log(e);
    }
})();