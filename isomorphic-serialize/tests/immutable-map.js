const test = require("ava");
const { Map } = require("immutable");

const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const run = (aValue, t) => t.true(aValue.equals(convert(aValue)));

test("empty", t => run(Map(), t));

test("simple", t => run(Map([[1, true],[2, false],[3, "abc"]]), t));

test("Nested primative", t =>
{

    const value = Map([["foo", "abc"], [123, {"bar": "baz"}]]);
    const value2 = convert(value);
    t.is(value.size, value2.size);
    t.is(value.first(), value2.first());
    t.deepEqual(value.last(), value2.last());
});

test("Nested 2", t => run(Map([["foo", "abc"], Map([["bar", "baz"]])]), t));

