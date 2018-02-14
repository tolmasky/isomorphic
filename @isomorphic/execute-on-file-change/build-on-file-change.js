const executeOnChange = require("./execute-on-change");
const executeOnFileChange = require("./execute-on-file-change");


module.exports = function ({ source, match, build, deploy })
{
    const deployer = executeOnChange({ execute: deploy });
    const builder = executeOnFileChange({ source, match, execute: build });
    
    builder.emitter
        .on("change", outputFilesChanged(source))
        .on("execution-cancel", () => announce("• Canceling build due to file changes"))

        // FIXME: We should do this on build START
        .on("execution-complete", () => deployer.change());

    return { };
}

function outputFilesChanged(source, changes)
{
    if (arguments.length === 1)
        return changes => outputFilesChanged(source, changes);

    console.log("• Detected file changes...");

    const concated = [].concat(...changes);
    console.log(concated);
    const expanded = concated.length > 15 ? 10 : 15;

    const head = concated.slice(0, expanded);
    const rest = Math.max(concated.length - expanded, 0);

    const files = changes.map(({ path, action }) =>
        `  - ${path.substr(source.length)} was ${action}.`).join("\n") +
        (rest > 0 ? "\n  - and ${head.length - limit} more..." : "");

    console.log(files);
}
