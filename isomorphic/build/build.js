
const { join, resolve } = require("path");
const { Set } = require("immutable");

const { build, transform } = require("@njudah/builder");

const babel = require("@njudah/builder/transform/babel");
const builder = require("@njudah/builder/promisified");
const { write } = require("@njudah/builder/fs-sync");
const { execSync } = require("child_process");



const BABEL_OPTIONS =
{
    "parserOpts": {
        "allowReturnOutsideFunction": true
    },
    "presets": ["react"],
    "plugins": [
        "transform-object-rest-spread",
        [require.resolve("./plugins/babel-plugin-assets"),
        {
            outputs:
            {
                "~/(*anything/):name.js": "~/assets/:name.bundle.js"
            },
            assets:
            {
                "~/assets/*antyhing": "/assets/*antyhing"
            }
        }],
    ],
    // We need this to find the babel plugins.
    "pluginsSearchDirectory": __dirname
};

(async function ()
{
    const source = ".";
    const cache = "./build-products/cache";
    const destination = "./build-products";

    const result = await builder(
        [build, { source, cache, destination, ignore: ["**/build-products", "**/node_modules"] },
            [transform, { match: "**/*.js", ignore: "**/assets/**" },
                [babel, { options: BABEL_OPTIONS } ]
            ]
        ]
    );

    const flattened = result.metadata
        .valueSeq()
        .map(Set)
        .reduce((combined, set) => combined.union(set), Set());

    write(
    {
        path: join(result.destination, "asset-instructions.json"),
        contents: JSON.stringify(flattened, null, 2),
        encoding: "utf-8"
    });
console.log("ok!");
    execSync(`cd ${__dirname} && node ${require.resolve("gulp/bin/gulp.js")} --assets ${resolve(join(result.destination, "asset-instructions.json"))} --destination ${resolve(result.destination)}`, { stdio:[0,1,2] });
    console.log("and");
    console.log(`node ${join(result.destination, "test.js")}`);
    execSync(`node  ${join(result.destination, "test.js")}`, { stdio:[0,1,2] });
})();
/*    
}*/
