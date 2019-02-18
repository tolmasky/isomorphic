const t = require("@babel/types");
const parameters = ["exports", "require", "module", "__filename", "__dirname"];
const reversed = [...parameters].reverse();
const functionParameters = (parameters =>
    parameters.map((_, index) =>
        parameters.slice(0, parameters.length - index)))
    (parameters.map(name => t.Identifier(name)));


module.exports = function moduleWrap(globals, program)
{
    const index = reversed.findIndex(key => globals.has(key));
    const parameters = functionParameters[index] || [];
    const blockStatement = t.blockStatement(program.body, program.directives);
    const functionExpression =
        t.functionExpression(null, parameters, blockStatement);

    return t.program([t.expressionStatement(functionExpression)]);
}
