const { data, string, number } = require("@algebraic/type");

module.exports = data `Product` (
    destination => string,
    integrity   => string,
    duration    => number );
