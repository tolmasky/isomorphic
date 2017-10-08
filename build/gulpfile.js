


const gulp = require("gulp");
const browserify = require("browserify");
const vinyl = require('vinyl-source-stream');
const { dirname, basename } = require("path");
const babelify = require("babelify").configure(
{
    presets: [require("babel-preset-es2015"), require("babel-preset-react")],
    plugins: [require("babel-plugin-transform-object-rest-spread")]
});
const fs = require("fs");


const { assets: file, destination } = require("commander")
    .option("--assets [assets]")
    .option("--destination [destination]")
    .parse(process.argv);
const hasOwnProperty = Object.prototype.hasOwnProperty;
console.log(destination);
const deroot = key => object => !hasOwnProperty.call(object, key) ?
    object : ({ ...object, [key]: object[key].replace(/\~\//g, destination + "/") });
const assets = require(file)
    .map(deroot("input"))
    .map(deroot("output"));
const sources = assets.filter(asset => hasOwnProperty.call(asset, "output"));

gulp.task("scripts", sources.reduce(forSource, []), () => { });

function forSource(dependencies, { input, output, excludes = [] })
{
    gulp.task(output, dependencies, function ()
    {console.log("BUILDING " + output);
        var bundle = browserify({
            entries: "./rehydrate",
            require: input,
            extensions: [".js"],
            debug: true,
            cache: {},
            packageCache: {},
            fullPaths: false,
            basedir: "..",
            transform: [babelify]
        })

        return bundle.bundle()
              .pipe(vinyl(basename(output)))
              .pipe(gulp.dest(dirname(output)));
    });

    return [output];
}

gulp.task("fix-scripts", ["scripts"], function ()
{
    for (const { output } of sources)
        fs.writeFileSync(output,
            fs.readFileSync(output, "utf-8").replace(destination, ""),
            "utf-8");
});


gulp.task("default", ["fix-scripts"], function ()
{
    const checksums = assets
        .map(({ URL, output, input }) =>
            ({ [URL]: getFileChecksum(output || input) }))
        .reduce((checksums, checksum) =>
            Object.assign(checksums, checksum), { });

    fs.writeFileSync(
        "./asset-checksums.json",
        JSON.stringify(checksums),
        "utf-8");
});

function getFileChecksum(aPath)
{
    return "sha512-" + require("crypto")
        .createHash("sha512")
        .update(fs.readFileSync(aPath, "utf-8"))
        .digest("base64");
}

