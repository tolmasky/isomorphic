const { data, string } = require("@algebraic/type");

module.exports = data `Target` (
    entrypoint  => string,
    destination => string );
