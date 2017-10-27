const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const run = (aValue, t) => t.deepEqual(convert(aValue), aValue);

test("empty", t => run([], t));

test("simple", t => run([1,2,3], t));
test("simple 2", t => run(["foo", "bar"], t));

test("Nested", t => run(["foo", ["bar", "baz"]], t));

