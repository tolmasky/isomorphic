const { string } = require("@algebraic/type");
const { Set } = require("@algebraic/collections");
const Metadata = require("@isomorphic/build/plugin/metadata");


module.exports = function (_, options)
{
    return { visitor: { Program } };

    function Program({ scope }, state)
    {
        const globals = Set(string)(Object.keys(scope.globals));

        state.file.metadata = Metadata({ globals });
    };
}
