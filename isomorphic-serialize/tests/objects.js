const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const run = (aValue, t) => t.deepEqual(convert(aValue), aValue);

test("empty", t => run({}, t));

test("simple", t => run({foo: 123}, t));
test("simple 2", t => run({foo: "abc"}, t));

test("Nested", t => run({foo: { bar: "bar"}}, t));

