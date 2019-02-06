const { data, string } = require("@algebraic/type");

module.exports = data `Product` (
    entrypoint  => string,
    destination => string );
