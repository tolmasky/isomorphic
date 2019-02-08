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
    `if (x || true) { console.log("yes") } else { console.log("no") }`,
    `if (true || true) { console.log("yes") } else { console.log("no") }`,
    `if (x && false) { console.log("yes") } else { console.log("no") }`,
    `if (!(x && false)) { console.log("yes") }`,
    `typeof 5`,
    `!(typeof 5)`,
    `"x"-"y"===0/0`,
    `if(![x()]){y();}else{z();}`,
    `5>7 && p`,
    "5>7",
    "true && x",
    "false && x",
    "x || 0",
    "false || 0",
    "0 || 1",
    "+1",
    "-4",
    "-0"
].map(x => console.log(doit(x).code));
