
module.exports.invoker = invoker;

function invoker(methodName)
{
    return function()
    {
        var anObject = arguments[arguments.length - 1];
        var args = Array.prototype.slice.apply(arguments, [0, arguments.length - 1]);
        return anObject[methodName].apply(anObject, args);
    };
}
