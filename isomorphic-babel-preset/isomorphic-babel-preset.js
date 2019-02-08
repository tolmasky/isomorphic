const intersects = require("semver").intersects;

const option = key => options => !!options[key];
const OR = (lhs, rhs) => input => lhs(input) || rhs(input);
const AND = (lhs, rhs) => input => lhs(input) && rhs(input);
const NOT = lhs => input => !lhs(input);

const ALWAYS = () => true;

const { isArray } = Array;
const browser = options => options.engine === "browser";
const node = range => options =>
    options.engine &&
    options.engine.node &&
    (isArray(options.engine.node) ?
        intersects(range, options.engine.node[0]) :
        intersects(range, options.engine.node));
const flag = flag => options =>
    options.engine &&
    options.engine.node &&
    !isArray(options.engine.node) ||
    options.engine.node.slice(1).indexOf(flag) >= 0;

const withDefault = (value, existing, message) =>
    existing === void(0) ?
        (message && console.warn(message), value) :
        existing;


module.exports = function (_, options)
{
    const engine = withDefault("browser", options.engine,
        `No "engine" specified in the options for @isomorphic/babel-preset. ` +
        `Using the default "browser", but you should specify this explicitly.`);
    const environment = withDefault("development", options.environment,
        `No "environment" specified in the options for ` +
        `@isomorphic/babel-preset. Using the default "development", but you ` +
        `should specify this explicitly.`);
    const browser = options.engine === "browser";
    const generatedReplacements =
    {
        process:
        {
            browser,
            env:
            {
                NODE_ENV: environment
            }
        }
    };
    const memberExpressionsReplacements = withDefault(generatedReplacements,
        options.memberExpressionsReplacements/*,
        `No "memberExpressionsReplacements" specified in the options for ` +
        `@isomorphic/babel-preset. Using ` +JSON.stringify(generatedReplacements)*/);

    const react = !!options.react;
    const normalized =
        { react, engine, environment, memberExpressionsReplacements };
    const plugins = pluginDescriptions
        .filter(pluginDescription => pluginDescription[0](normalized))
        .map(([, generator]) =>
            typeof generator === "string" ? require(generator) :
            isArray(generator) ? [require(generator[0]), generator[1]] :
            typeof generator === "function" ? generator(normalized) :
            (() => { throw Error("Can't parse plugin") })());

    return { plugins };
}

const pluginDescriptions =
[
    [OR(browser, node("< 0.12")), "@babel/plugin-transform-for-of"],
    [OR(browser, node("< 0.12")), "@babel/plugin-check-constants"],
    [OR(browser, node("< 0.12")), "@babel/plugin-transform-typeof-symbol"],

    [OR(browser, AND(node("< 0.13.0"), NOT(flag("--harmony-generators")))),
        ["@babel/plugin-transform-regenerator",
            { async: false, asyncGenerators: false }]],

    [OR(browser, node("< 4")), "@babel/plugin-transform-template-literals"],
    [OR(browser, node("< 4")), "@babel/plugin-transform-literals"],
    [OR(browser, node("< 4")), "@babel/plugin-transform-arrow-functions"],
    [OR(browser, node("< 4")), "@babel/plugin-transform-shorthand-properties"],
    [OR(browser, node("< 4")), "@babel/plugin-transform-computed-properties"],

    [OR(browser, node("< 4")), "@babel/plugin-transform-object-super"],
    [OR(browser, node("< 4")), "@babel/plugin-transform-classes"],

    [OR(browser, node(">= 4 < 6")), "./babel-plugin-transform-strict-classes"],
    [OR(browser, node("4.x.x")), "./babel-plugin-transform-super-spread"],

    [OR(browser, node("< 5")), "@babel/plugin-transform-spread"],

    [OR(browser, node("< 6")), "@babel/plugin-transform-sticky-regex"],
    [OR(browser, node("< 6")), "@babel/plugin-transform-unicode-regex"],

    [OR(browser, node("< 6")), "@babel/plugin-transform-destructuring"],
    [OR(browser, node("< 6")), "@babel/plugin-transform-block-scoping"],

    [OR(browser, node("< 7")), "@babel/plugin-transform-parameters"],
    [OR(browser, node("< 7.6.0")), "@babel/plugin-transform-async-to-generator"],

    [ALWAYS, "@babel/plugin-transform-function-name"],

    [OR(browser, node("< 8.3.0")), "@babel/plugin-proposal-object-rest-spread"],
    [node(">= 8.3.0"), () => ({
        manipulateOptions: function manipulateOptions(opts, parserOpts) {
          parserOpts.plugins.push("objectRestSpread");
        }
    })],

    [   option("react"),
        options =>
        [
            require("@babel/plugin-transform-react-jsx"),
            // This handles .pragma
            typeof options.react === "object" ? options.react : { }
        ]
    ],

    [   option("memberExpressionsReplacements"),
        options =>
        [
            require("./babel-plugin-transform-replace-global-member-expressions.js"),
            { replacements: options.memberExpressionsReplacements }
        ]
    ]
];


