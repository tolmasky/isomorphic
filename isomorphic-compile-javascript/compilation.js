const { data, boolean } = require("@algebraic/type");

const Compilation = require("@isomorphic/build/plugin/compilation");
const Metadata = data `Metadata` (
    referencesGlobalBuffer  => [boolean, false],
    referencesGlobalProcess => [boolean, false] );

module.exports = Compilation(Metadata);
module.exports.Metadata = Metadata;
