
const { dirname, basename } = require("path");
const { readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const mkdirp = path => execSync(`mkdir -p ${JSON.stringify(path)}`);

const less = require("less");


module.exports = function isomorphicLess({ entrypoint, destination, options })
{
    const output = lessSynchronous(readFileSync(entrypoint, "utf-8"),
    {
        paths: [dirname(entrypoint)],
        filename: basename(entrypoint)
    });

    mkdirp(dirname(destination));
    writeFileSync(destination, output, "utf-8");

    return { entrypoints: new Set(), path: entrypoint };
}

function lessSynchronous(input, optionsMaybe)
{
    const options = Object.assign({ sync: true }, optionsMaybe);

    less.render(input, options, function (error, result)
    {
        if (error)
            throw error;

        css = result.css;
    })

    return css;
}
