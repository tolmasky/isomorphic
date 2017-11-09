
const Module = require("module");
const { dirname, join, normalize } = require("path");
const EMPTY = Object.create(null);


module.exports = function dedupe(key, children, previouslyVisited)
{
    const extracted = new Set();
    const visited = previouslyVisited ?
        new Set(previouslyVisited) : extracted;

    for (const child of children)
        for (const path of ((child || EMPTY)[key] || []))
        {
            if (visited.has(path))
                continue;

            extracted.add(path);

            if (visited !== extracted)
                visited.add(path);
        }

    return [extracted, visited];
}
