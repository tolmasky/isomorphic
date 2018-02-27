
const { state, property } = require("./state");
const update = require("./mutation-chain");
const metadata = require("./metadata");

const Something = state.machine `Something`
({
    [property `name`]: "string",
    [property.child `something`]: "blah",
    
    [state `initial`]:
    {
        [state.on `start`]: update.prop("name", "o")
    }
});

console.log(update);
console.log(metadata(update(new Something({ name: "hello", state:"initial" }), { name:"start" })))
/*

console.log(new Something({ name: "hello", state:"initial" }));

console.log(update.prop("name", "p")(new Something({ name: "hello", state:"initial" })))*/