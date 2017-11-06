const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const fastConvert = aValue => parse(stringify(aValue, { fastMode: true }));
const run = (aValue, t) =>
{
    t.deepEqual(convert(aValue), aValue);
    t.deepEqual(fastConvert(aValue), aValue);
};

test("empty", t => run(new Set(), t));

test("simple", t => run(new Set(["foo", 123]), t));
test("simple 2", t => run(new Set(["abc", 123]), t));
test("Duplicates", t => run(new Set(["abc", 123, 123, "abc"]), t));

test("Nested", t => run(new Set(["foo", new Set(["bar", 123])]), t));

test("generic", t =>
{
    var value = new Set(["foo", 123]);
    value.foo = "bar";

    run(value, t);
});
