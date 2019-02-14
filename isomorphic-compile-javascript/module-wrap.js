const parameters = ["exports", "require", "module", "__filename", "__dirname"]
const reversed = [...parameters].reverse();


module.exports = function moduleWrap(globals, contents)
{
    const index = reversed.findIndex(key => globals.has(key));
    const used =
        index < 0 ? "" :
        index >= parameters.length - 1 ? 
            parameters.join(", ") :
            parameters.slice(0, reversed.length - index).join(", ");

    return "(function (" + used + "){\n" + contents + "\n})";
}
