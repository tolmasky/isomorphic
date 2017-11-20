const objectSerializationStringify = require("isomorphic-serialize/stringify");

const myValue = {
    name: "RunKit",
};

const bar = {
    myValue: myValue
};

myValue.bar = bar;

const serializedValue = objectSerializationStringify(myValue);
console.log("Serialized to " + serializedValue.length + " bytes.");

const objectSerializationParse = require("isomorphic-serialize/parse");
objectSerializationParse(serializedValue);
