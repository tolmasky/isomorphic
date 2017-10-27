const test = require("ava");
const { parse, stringify } = require("../");

const convert = aValue => parse(stringify(aValue));
const run = (aValue, t) => t.deepEqual(convert(aValue), aValue);

test("empty", t => run(new Map(), t));

test("simple", t => run(new Map([["foo", 123]]), t));
test("simple 2", t => run(new Map([["abc", 123]]), t));

test("Nested", t => run(new Map([["foo", new Map([["bar", 123]])]]), t));
