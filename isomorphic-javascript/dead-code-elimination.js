
const { transformFromAst } = require("babel-core");
const options =
{
    plugins: [
        require("./node-env"),
        require("babel-plugin-minify-dead-code-elimination"),
        require("babel-plugin-transform-es2015-destructuring")
    ],
    code: false
};

module.exports = function (AST, contents)
{
    return transformFromAst(AST, contents, options);
}
