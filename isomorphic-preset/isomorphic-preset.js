
const { intersects } = require("semver");

const range = range => ({ node }) => intersects(range, node);
const flag = flag => ({ flags }) => flags.indexOf(flag) >= 0;
const option = key => options => !!options[key];
const browser = option("browser");

const OR = (lhs, rhs) => input => lhs(input) || rhs(input);
const AND = (lhs, rhs) => input => lhs(input) && rhs(input);
const NOT = lhs => input => !lhs(input);

const ALWAYS = () => true;

const ReactJSXPlugin = require("babel-plugin-transform-react-jsx");


module.exports = function (_, { node, browser, flags = [], JSXPragma, ...options })
{
    return  {
                "plugins": plugins
                    .filter(([predicate]) => predicate({ node, browser, flags, ...options }))
                    .map(function ([predicate, plugin])
                    {
                        return  plugin === ReactJSXPlugin && JSXPragma ?
                                [plugin, { pragma: JSXPragma }] :
                                plugin;
                    })
            };
}

var plugins =
[
    [OR(browser, range("< 0.12")), require("babel-plugin-transform-es2015-for-of")],
    [OR(browser, range("< 0.12")), require("babel-plugin-check-es2015-constants")],
    [OR(browser, range("< 0.12")), require("babel-plugin-transform-es2015-typeof-symbol")],

    [OR(browser, AND(range("< 0.13.0"), NOT(flag("--harmony-generators")))),
        [require("babel-plugin-transform-regenerator"),
        { async: false, asyncGenerators: false }]],

    [OR(browser, range("< 4")), require("babel-plugin-transform-es2015-template-literals")],
    [OR(browser, range("< 4")), require("babel-plugin-transform-es2015-literals")],
    [OR(browser, range("< 4")), require("babel-plugin-transform-es2015-arrow-functions")],
    [OR(browser ,range("< 4")), require("babel-plugin-transform-es2015-shorthand-properties")],
    [OR(browser, range("< 4")), require("babel-plugin-transform-es2015-computed-properties")],

    [OR(browser, range("< 4")), require("babel-plugin-transform-es2015-object-super")],
    [OR(browser, range("< 4")), require("babel-plugin-transform-es2015-classes")],

    [OR(browser, range(">= 4 < 6")), require("./babel-plugin-transform-strict-classes")],
    [OR(browser, range("4.x.x")), require("./babel-plugin-transform-super-spread")],

    [OR(browser, range("< 5")), require("babel-plugin-transform-es2015-spread")],

    [OR(browser, range("< 6")), require("babel-plugin-transform-es2015-sticky-regex")],
    [OR(browser, range("< 6")), require("babel-plugin-transform-es2015-unicode-regex")],

    [OR(browser, range("< 6")), require("babel-plugin-transform-es2015-destructuring")],
    [OR(browser, range("< 6")), require("babel-plugin-transform-es2015-block-scoping")],

    [OR(browser, range("< 7")), require("babel-plugin-transform-es2015-parameters")],
    [OR(browser, range("< 7.6.0")), require("./babel-plugin-transform-inline-async-generator")],

    [ALWAYS, require("babel-plugin-transform-es2015-function-name")],

    [OR(browser, range("< 8.3.0")), require("babel-plugin-transform-object-rest-spread")],
    [range(">= 8.3.0"), () => ({
        manipulateOptions: function manipulateOptions(opts, parserOpts) {
          parserOpts.plugins.push("objectRestSpread");
        }
    })],

    [option("generic-jsx"), require("generic-jsx/babel-plugin-transform-generic-jsx")],
    [option("react"), ReactJSXPlugin],

    [ALWAYS, require("./babel-plugin-metadata")],
    [ALWAYS, require("./babel-plugin-entrypoints")],
    [ALWAYS, require("./babel-plugin-dependencies")],
    [ALWAYS, require("./babel-plugin-hydration")]

//    [always, require("babel-plugin-transform-es2015-block-scoped-functions")],
//    [always, require("babel-plugin-transform-es2015-modules-commonjs")]
];