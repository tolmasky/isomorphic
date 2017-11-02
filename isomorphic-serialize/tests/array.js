const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const fastConvert = aValue => parse(stringify(aValue, { fastMode: true }));
const run = (aValue, t) =>
{
    t.deepEqual(convert(aValue), aValue);
    t.deepEqual(fastConvert(aValue), aValue);
};

test("empty", t => run([], t));

test("simple", t => run([1,2,3], t));
test("simple 2", t => run(["foo", "bar"], t));

test("Nested", t => run(["foo", ["bar", "baz"]], t));

test("gapped", t =>
{
    var value = [1,2,3,,,,4,5,6,7];
    run(value, t);
});

test("generic ungapped", t =>
{
    var value = [1,2,3,4,5,6,7];
    value.foo = "bar";
    run(value, t);
});

test("generic gapped", t =>
{
    var value = [1,2,3,4,,,,,5,6,7];
    value.foo = "bar";
    run(value, t);
});

