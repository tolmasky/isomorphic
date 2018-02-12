const execOnFileChange = require("./files-changed/files-watcher-2");
const { spawn } = require("child_process");

const style = require("chalk").bgBlue.white.bold;
const announce = message => console.log(style(message));


module.exports = function watch({ source, completed })
{
    const match = `${source}/!(_cache|_site)**/*`;

    execOnFileChange({ source, match, execute: execute(source) })
        .on("files-changed", filesChanged(source))
        .on("execution-cancel", () => announce("• Canceling build due to file changes"))
        .on("executing-complete", () => completed());
}

function execute(source)
{
    return function ()
    {
        announce("• Building blog.runkit.com... ");
    
        return spawn("node", [require.resolve("./petrified-cli"), "--dev", source], { stdio: [0,1,2] });
    }
}

function filesChanged(source, changes)
{
    if (arguments.length === 1)
        return changes => filesChanged(source, changes);

    console.log("• Detected file changes...");

    const expanded = changes.length > 15 ? 10 : 15;

    const head = changes.slice(0, expanded);
    const rest = Math.max(changes.length - expanded, 0);

    const files = changes.map(({ path, action }) =>
        `  - ${path.substr(source.length)} was ${action}.`).join("\n") +
        (rest > 0 ? "\n  - and ${head.length - limit} more..." : "");

    console.log(files);
}
