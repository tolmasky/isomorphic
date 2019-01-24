const parameters = ["exports", "require", "module", "__filename", "__dirname"];


module.exports = function moduleWrap(globals, contents)
{
    const index = last(parameters, key => globals[key]) + 1;
    const used =
        index <= 0 ? "" :
        index >= parameters.length ? parameters.join(", ") :
        parameters.slice(0, index).join(", ");

    return "(function (" + used + "){\n" + contents + "\n})";
}

function last(array, f)
{
    var count = array.length;
    
    while (count--)
        if (f(array[count]))
            return count;

    return -1;
}
