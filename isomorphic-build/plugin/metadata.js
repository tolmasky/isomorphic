const { data, string } = require("@algebraic/type");
const { Set } = require("@algebraic/collections");

module.exports = data `Metadata` (
    dependencies    => [Set(string), Set(string)()],
    entrypoints     => [Set(string), Set(string)()],
    assets          => [Set(string), Set(string)()],
    globals         => [Set(string), Set(string)()] );
