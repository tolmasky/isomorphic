const { execSync } = require("child_process");
const on = require("./files-watcher-2");
const { fork } = require("child_process");

const style = require("chalk").bgBlue.white.bold;
const announce = message => console.log(style(message));

(function ({ source })
{
    const match = "**/*";

    on({ source, match, execute: execute(source) })
        .on("files-changed", filesChanged(source))
        .on("execution-cancel", () => announce("• Canceling build due to file changes"))

})({ source: "/Users/tolmasky/Desktop/" });

function execute(source)
{
    return function ()
    {
        announce("• Rebuilding blog.runkit.com... ");

        return fork("./tester");
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

touch("CAUSE INITIAL FIRE", 1000);
touch("CAUSE KEEP LOOKIng", 1050);
touch("CAUSE CANCEL", 1500);

function touch(message, time)
{
    setTimeout(function()
    {
        console.log(message)
        execSync("touch ~/Desktop/Form.pdf");
    }, time);
}

/*


    const source = "/Users/tolmasky/Desktop/";
    const changes = data.changes;
    const expanded = changes.length > 15 ? 10 : 15;

    const head = changes.slice(0, expanded);
    const rest = Math.max(changes.length - expanded, 0);

    const message = changes.map(change =>
        `${change.path.substr(source.length)} was ${change.action}.`).join("\n") +
        (rest > 0 ? "\nand ${head.length - limit} more..." : "");

    console.log(message);
    
    */
