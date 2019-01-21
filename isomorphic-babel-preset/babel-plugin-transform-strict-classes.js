
var template = require("@babel/template").default;

var buildClassWithSuperClass = template("(function (x, superClass) { x.next(); return x.next(superClass); })((function *() { \"use strict\"; return CLASS_EXPRESSION; }).apply(this, arguments), SUPER_CLASS).value");
var buildClassWithoutSuperClass = template(" (function () { \"use strict\"; return CLASS_EXPRESSION; }).apply(this, arguments)");


module.exports = function(options)
{
    var Plugin = options.Plugin;
    var types = options.types;

    return {
                visitor:
                {
                    ClassDeclaration: function(aPath)
                    {
                        return aPath.replaceWith(buildWrappedClassExpression(aPath.node, false, types));
                    },

                    ClassExpression: function (aPath)
                    {
                        if (aPath.node["tonic-visited"] === true)
                            return;

                        return aPath.replaceWith(buildWrappedClassExpression(aPath.node, true, types));
                    }
                }
            };
}

function buildWrappedClassExpression(aNode, isClassExpression, types)
{
    var classExpression =   isClassExpression && !aNode.superClass ?
                            aNode : buildClassExpression(aNode, types);

    classExpression["tonic-visited"] = true;
    
    if (!aNode.superClass)
        return buildClassWithoutSuperClass({ CLASS_EXPRESSION: classExpression }, types);

    return buildClassWithSuperClass({ CLASS_EXPRESSION: classExpression, SUPER_CLASS: aNode.superClass }, types);
}

function buildClassExpression(aNode, types)
{
    var superClass = aNode.superClass;

    return types.classExpression(aNode.id || null, superClass && parenthesizedYieldExpression(types), aNode.body, []);
}

function parenthesizedYieldExpression(types)
{
    return types.parenthesizedExpression(types.yieldExpression());
    
    expression.parenthesized = true;
    
    return expression;
}

