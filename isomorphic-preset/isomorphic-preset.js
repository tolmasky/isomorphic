
const { intersects } = require("semver");

const range = range => ({ node }) => intersects(range, node);
const flag = flag => ({ flags }) => flags.indexOf(flag) >= 0;
const option = key => options => !!options[key];

const OR = (lhs, rhs) => input => lhs(input) || rhs(input);
const AND = (lhs, rhs) => input => lhs(input) && rhs(input);
const NOT = lhs => input => !lhs(input);

const ALWAYS = () => true;

const ReactJSXPlugin = require("babel-plugin-transform-react-jsx");


module.exports = function (_, { node, flags = [], JSXPragma, ...options })
{
    return  {
                "plugins": plugins
                    .filter(([predicate]) => predicate({ node, flags, ...options }))
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
    [range("< 0.12"), require("babel-plugin-transform-es2015-for-of")],
    [range("< 0.12"), require("babel-plugin-check-es2015-constants")],
    [range("< 0.12"), require("babel-plugin-transform-es2015-typeof-symbol")],

    [AND(range("< 0.13.0"), NOT(flag("--harmony-generators"))),
        [require("babel-plugin-transform-regenerator"),
        { async: false, asyncGenerators: false }]],

    [range("< 4"), require("babel-plugin-transform-es2015-template-literals")],
    [range("< 4"), require("babel-plugin-transform-es2015-literals")],
    [range("< 4"), require("babel-plugin-transform-es2015-arrow-functions")],
    [range("< 4"), require("babel-plugin-transform-es2015-shorthand-properties")],
    [range("< 4"), require("babel-plugin-transform-es2015-computed-properties")],

    [range("< 4"), require("babel-plugin-transform-es2015-object-super")],
    [range("< 4"), require("babel-plugin-transform-es2015-classes")],

    [range(">= 4 < 6"), require("./babel-plugin-transform-strict-classes")],
    [range("4.x.x"), require("./babel-plugin-transform-super-spread")],

    [range("< 5"), require("babel-plugin-transform-es2015-spread")],

    [range("< 6"), require("babel-plugin-transform-es2015-sticky-regex")],
    [range("< 6"), require("babel-plugin-transform-es2015-unicode-regex")],

    [range("< 6"), require("babel-plugin-transform-es2015-destructuring")],
    [range("< 6"), require("babel-plugin-transform-es2015-block-scoping")],

    [range("< 7"), require("babel-plugin-transform-es2015-parameters")],
    [range("< 7.6.0"), require("./babel-plugin-transform-inline-async-generator")],

    [ALWAYS, require("babel-plugin-transform-es2015-function-name")],

    [ALWAYS, require("babel-plugin-transform-object-rest-spread")],

    [option("generic-jsx"), require("generic-jsx/babel-plugin-transform-generic-jsx")],
    [option("react"), ReactJSXPlugin]

//    [always, require("babel-plugin-transform-es2015-block-scoped-functions")],
//    [always, require("babel-plugin-transform-es2015-modules-commonjs")]
];