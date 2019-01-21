var template = require("@babel/template").default;
var evaledSuper = template("var NAME = OBJECT; eval(\"super(\" + (function (name, count)\
{\
    var index = 0;\
    var string = \"\";\
    \
    for (; index < count; ++index)\
         string += name + \"[\" + index + \"]\" + (index < count - 1 ? \",\" : \"\");\
\
    return string;\
})(NAME_STRING, NAME.length) + \")\");");

module.exports = function(options)
{
    var Plugin = options.Plugin;
    var types = options.types;

    return {
                visitor:
                {
                    CallExpression: function(aPath)
                    {
                        var node = aPath.node;
                        var args = node.arguments;

                        if (!hasSpread(args))
                            return;

                        var calleePath = aPath.get("callee");

                        if (!calleePath.isSuper())
                            return;

                        var uniqueIdentifier = aPath.scope.generateUidIdentifier();

                        aPath.replaceWithMultiple(evaledSuper({ NAME: uniqueIdentifier, NAME_STRING: types.stringLiteral(uniqueIdentifier.name), OBJECT:types.arrayExpression(args) }));
                    }
                }
            }

    function hasSpread(args)
{
    var index = 0;

    for (; index < args.length; ++index)
        if (types.isSpreadElement(args[index]))
            return true;

    return false;
}
}


