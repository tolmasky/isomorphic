const reduce = require(".");


function doit(code)
{
    const AST = require("@babel/parser").parse(code);
    const node = reduce(AST.program);

    return require("@babel/generator").default(node)
}

[
    "if (true) { console.log(1) }",
    `!"x"`,
    `if("x"==="x") { console.log("yes") }`,
    `if("x" + "y" ==="xy") { console.log("yes") }`,
    `if (!(x && false)) { console.log("yes") }`,
    `typeof 5`,
    `!(typeof 5)`,
    `"x"-"y"===0/0`,
    `if(![x()]){y();}else{z();}`,
    `5>7 && p`,
    "5>7",
    "true && x",
    "false && x"
].map(x => console.log(doit(x).code));
