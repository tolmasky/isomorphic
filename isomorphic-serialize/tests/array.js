const test = require("ava");
const { parse, stringify } = require("../");
const Features = require("../features");

const convert = aValue => parse(stringify(aValue));
const fastConvert = aValue => parse(stringify(aValue, { protocol: 0 }));
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

test("empty with gaps", t =>
{
    var value = [,,,,,,,,,];
    run(value, t);
});

test("trailing gaps with middle gaps", t =>
{
    var value = [1,2,,,,3,,,,,,,];
    run(value, t);
});

test("trailing gaps", t =>
{
    var value = [1,2,3,,,,,,,];
    run(value, t);
});

test("empty with gaps and props", t =>
{
    var value = [,,,,,,,,,];
    value.foo = "Bar";
    run(value, t);
});

test("trailing gaps with properties", t =>
{
    var value = [1,2,3,,,,,,,];
    value.foo = "Bar";
    run(value, t);
});

test("leading gaps", t =>
{
    var value = [,,,,,,1,2,3];
    run(value, t);
});

test("leading gaps with properties", t =>
{
    var value = [,,,,,,1,2,3];
    value.foo = "Bar";
    run(value, t);
});

test("trailing gaps with middle gaps and leading gaps", t =>
{
    var value = [,,,,1,2,,,,3,,,,,,,];
    run(value, t);
});

test("trailing gaps with middle gaps and leading gaps with properties", t =>
{
    var value = [,,,,1,2,,,,3,,,,,,,];
    value.foo = "Bar";
    run(value, t);
});

test("Compressed array", t =>
{
    var value = [1,2,3];
    var string = stringify(value);
    t.deepEqual(parse(string), value);

    var expected = `{"index":0,"objects":[[0,1,2,3],1,2,3],"typeMap":{"0":2}}`;
    t.is(expected, string);
});

test("Legacy array, no compression", t =>
{
    var value = [1,2,3];
    var string = stringify(value, { protocol: 1 });
    t.deepEqual(parse(string), value);

    var expected = `{"index":0,"objects":[[1,2,1,4,3,6,5],1,"0",2,"1",3,"2"]}`;
    t.is(expected, string);
});
