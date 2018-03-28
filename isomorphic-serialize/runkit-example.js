const { stringify, parse } = require("@isomorphic/serialize");

const myValue = {
    name: "RunKit",
};

const bar = {
    myValue: myValue
};

myValue.bar = bar;

const serializedValue = stringify(myValue);
console.log("Serialized to " + serializedValue.length + " bytes.");

const revivedObject = parse(serializedValue);