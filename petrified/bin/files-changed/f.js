const { execSync } = require("child_process");
const on = require("./files-watcher-2");

on({ source: "/Users/tolmasky/Desktop", match: "**/*" });

touch("CAUSE INITIAL FIRE", 1000);
touch("CAUSE KEEP LOOKIng", 1050);
touch("CAUSE CANCEL", 1500);

function touch(message, time)
{
    setTimeout(function()
    { 
        console.log(message)
        execSync("touch touch ~/Desktop/Form.pdf");
    }, time);
}
