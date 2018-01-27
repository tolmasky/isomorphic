
module.exports = function(options)
{
    var Plugin = options.Plugin;
    var types = options.types;

    return {
                inherits: require("babel-plugin-syntax-async-functions"),
                visitor:
                {
                    Function: toGeneratorAsynchronousFunction(types),
                    ClassMethod: toGeneratorAsynchronousFunction(types),
                    ObjectMethod: toGeneratorAsynchronousFunction(types),
                    AwaitExpression: function(aPath)
                    {
                        return aPath.replaceWith(types.yieldExpression(aPath.node.argument));
                    }
                }
            };
}

var stepperFunctionTemplate = "(function step(generator)\
{\
    return new Promise(function (resolve, reject)\
    {\
        (function step(key, arg)\
        {\
            if (arguments.length === 1)\
                return function(arg) { step(key, arg) };\
            try\
            {\
                var info = generator[key](arg);\
                var value = info.value;\
            }\
            catch (error)\
            {\
                reject(error);\
                return;\
            }\
            if (info.done)\
                resolve(value);\
            else\
                Promise.resolve(value)\
                    .then(step(\"next\"), step(\"throw\"));\
        })(\"next\", void 0);\
    });\
})";

var parse = require("babylon").parse;
var stepperFunctionExpression = parse(stepperFunctionTemplate).program.body[0].expression;

(function remove(node)
{
    if (!node || typeof node !== "object")
        return;

    delete node.loc;

    var keys = Object.getOwnPropertyNames(node);
    var index = 0;
    var count = keys.length;

    for (; index < count; ++index)
    {
        var key = keys[index];

        remove(node[key]);
    }
})(stepperFunctionExpression);


function toGeneratorAsynchronousFunction(types, aPath)
{
    if (arguments.length === 1)
        return function(aPath) { return toGeneratorAsynchronousFunction(types, aPath); }

    var node = aPath.node;

    if (!node.async)
        return;
    
    var generatorFunctionExpression = types.functionExpression(null, node.params, node.body);

    generatorFunctionExpression.generator = true;

    var callExpression = types.callExpression(stepperFunctionExpression, [types.callExpression(types.memberExpression(generatorFunctionExpression, types.identifier("apply")), [types.thisExpression(), types.identifier("arguments")])]);

    if (types.isArrowFunctionExpression(node))
        return aPath.replaceWith(types.arrowFunctionExpression(node.params, callExpression));

    var returnStatement = types.returnStatement(callExpression);
    var blockStatement = types.blockStatement([returnStatement]);

    if (types.isFunctionExpression(node))
        return aPath.replaceWith(types.functionExpression(node.id, node.params, blockStatement));

    if (types.isFunctionDeclaration(node))
        return aPath.replaceWith(types.functionDeclaration(node.id, node.params, blockStatement));

    if (types.isClassMethod(node))
        return aPath.replaceWith(types.classMethod(node.kind, node.key, node.params, blockStatement, node.computed, node.static));

    if (types.isObjectMethod(node))
        return aPath.replaceWith(types.objectMethod(node.kind, node.key, node.params, blockStatement, node.computed));
}
