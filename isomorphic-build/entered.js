const { data, string } = require("@algebraic/type");
const { Set } = require("@algebraic/collections");

const Entered = data `Entered` (
    dependencies => Set(string) );

module.exports = Entered;
/*
const { data, string, number } = require("@algebraic/type");

module.exports = data `Product` (
    destination => string,
    integrity   => string,
    duration    => number );

folder -> makes_real_folder, returns dependencies
file -> makes_intermediate, copies to real place, returns dependencies

bundle -> returns self as dependency
file -> makes_intermediate, returns dependencies
bundle -> puts together*/