const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const fastConvert = aValue => parse(stringify(aValue, { fastMode: true }));
const run = (aValue, t) =>
{
    t.deepEqual(convert(aValue), aValue);
    t.deepEqual(fastConvert(aValue), aValue);
};

test("empty", t => run(new Map(), t));

test("simple", t => run(new Map([["foo", 123]]), t));
test("simple 2", t => run(new Map([["abc", 123]]), t));

test("Nested", t => run(new Map([["foo", new Map([["bar", 123]])]]), t));

test("generic", t =>
{
    var value = new Map([["foo", 123]]);
    value.foo = "bar";

    run(value, t);
});
