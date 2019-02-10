const { data, boolean, string } = require("@algebraic/type");
const { Set } = require("@algebraic/collections");

const Compilation = require("@isomorphic/build/plugin/compilation");
const Metadata = data `Metadata` (
    implicitBuiltInDependencies => [Set(string), Set(string)()] );

module.exports = Compilation(Metadata);
module.exports.Metadata = Metadata;
