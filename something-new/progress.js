
module.exports = function progress(message, action)
{
    return function (...args)
    {
        const string = typeof message === "function" ?
            message(...args) : message;
        const stop = indicator(string);

        return Promise.resolve(action(...args))
            .then(result => (stop(), result))
            .catch(error => { stop(); throw error });
    }
}

function indicator(message)
{
    let index = 0;
    const indicator = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
    const count = indicator.length;
    const stream = process.stdout;
    const readline = require("readline");
    const timeout = setInterval(function ()
    {
        readline.clearLine(stream, 0);
        readline.cursorTo(stream, 0);

        process.stdout.write(`${indicator[index++ % count]} ${message}`);
    }, 20);

    return function stop()
    {
        readline.clearLine(stream, 0);
        readline.cursorTo(stream, 0);

        clearInterval(timeout);
    }
}
