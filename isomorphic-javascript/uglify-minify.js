
const uglify = require("uglify-js");

const MinificatioOptions = 
{
    // We'd like to get rid of the *trailing* semicolon for concatenation
    // purposes, but our only option is getting rid of all unecessary 
    // semicolons. https://github.com/mishoo/UglifyJS2/issues/2477
    output: { semicolons: false },
    
    // Out top level function expression would be completely removed
    // without this.
    compress: { side_effects: false }
};


module.exports = function minify(input)
{
    const { code, error } = uglify.minify(input, MinificatioOptions);

    if (error)
        throw error;

    return code;
}
