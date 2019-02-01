const { data, string } = require("@algebraic/type");
const { OrderedSet, Set } = require("@algebraic/collections");
const Metadata = data `Metadata` (
    dependencies    => [OrderedSet(string), OrderedSet(string)()],
    entrypoints     => [Set(string), Set(string)()],
    assets          => [Set(string), Set(string)()],
    globals         => [Set(string), Set(string)()] );

module.exports = function (_, options)
{
    return { visitor: { Program } };

    function Program({ scope }, state)
    {
        const globals = Set(string)(Object.keys(scope.globals));

        state.file.metadata = Metadata({ globals });
    };
}

module.exports.Metadata = Metadata;
