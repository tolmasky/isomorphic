const intersects = require("semver").intersects;

const range = range => options => options.node && intersects(range, options.node);
const flag = flag => options => (options.flags || []).indexOf(flag) >= 0;
const option = key => options => !!options[key];
const browser = option("browser");

const OR = (lhs, rhs) => input => lhs(input) || rhs(input);
const AND = (lhs, rhs) => input => lhs(input) && rhs(input);
const NOT = lhs => input => !lhs(input);

const ALWAYS = () => true;

const ReactJSXPlugin = require("@babel/plugin-transform-react-jsx");


module.exports = function (_, options)
{
    const JSXPragma = options.JSXPragma;

    return  {
                "plugins": pluginDescriptions
                    .filter(pluginDescription => pluginDescription[0](options))
                    .map(function (pluginDescription)
                    {
                        const plugin = pluginDescription[1];
                        const predicate = pluginDescription[0];

                        return  plugin === ReactJSXPlugin && JSXPragma ?
                                [plugin, { pragma: JSXPragma }] :
                                plugin;
                    })
            };
}

var pluginDescriptions =
[
    [OR(browser, range("< 0.12")), require("@babel/plugin-transform-for-of")],
    [OR(browser, range("< 0.12")), require("@babel/plugin-check-constants")],
    [OR(browser, range("< 0.12")), require("@babel/plugin-transform-typeof-symbol")],

    [OR(browser, AND(range("< 0.13.0"), NOT(flag("--harmony-generators")))),
        [require("@babel/plugin-transform-regenerator"),
        { async: false, asyncGenerators: false }]],

    [OR(browser, range("< 4")), require("@babel/plugin-transform-template-literals")],
    [OR(browser, range("< 4")), require("@babel/plugin-transform-literals")],
    [OR(browser, range("< 4")), require("@babel/plugin-transform-arrow-functions")],
    [OR(browser ,range("< 4")), require("@babel/plugin-transform-shorthand-properties")],
    [OR(browser, range("< 4")), require("@babel/plugin-transform-computed-properties")],

    [OR(browser, range("< 4")), require("@babel/plugin-transform-object-super")],
    [OR(browser, range("< 4")), require("@babel/plugin-transform-classes")],

    [OR(browser, range(">= 4 < 6")), require("./babel-plugin-transform-strict-classes")],
    [OR(browser, range("4.x.x")), require("./babel-plugin-transform-super-spread")],

    [OR(browser, range("< 5")), require("@babel/plugin-transform-spread")],

    [OR(browser, range("< 6")), require("@babel/plugin-transform-sticky-regex")],
    [OR(browser, range("< 6")), require("@babel/plugin-transform-unicode-regex")],

    [OR(browser, range("< 6")), require("@babel/plugin-transform-destructuring")],
    [OR(browser, range("< 6")), require("@babel/plugin-transform-block-scoping")],

    [OR(browser, range("< 7")), require("@babel/plugin-transform-parameters")],
    [OR(browser, range("< 7.6.0")), require("@babel/plugin-transform-async-to-generator")],

    [ALWAYS, require("@babel/plugin-transform-function-name")],

    [OR(browser, range("< 8.3.0")), require("@babel/plugin-proposal-object-rest-spread")],
    [range(">= 8.3.0"), () => ({
        manipulateOptions: function manipulateOptions(opts, parserOpts) {
          parserOpts.plugins.push("objectRestSpread");
        }
    })],

//    [option("generic-jsx"), require("generic-jsx/@babel/plugin-transform-generic-jsx"), "GENERIC JSX"],
    [option("react"), ReactJSXPlugin],

//    [ALWAYS, require("./babel-plugin-metadata")],
//    [ALWAYS, require("./babel-plugin-entrypoints")],
//    [ALWAYS, require("./babel-plugin-dependencies")],
 //   [ALWAYS, require("./babel-plugin-hydration")]

//    [always, require("@babel/plugin-transform-block-scoped-functions")],
//    [always, require("@babel/plugin-transform-modules-commonjs")]
];