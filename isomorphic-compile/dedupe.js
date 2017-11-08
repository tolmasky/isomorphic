
const Module = require("module");
const { dirname, join, normalize } = require("path");
const EMPTY = Object.create(null);


module.exports = function dedupe(key, children, visited)
{
    const track = !!visited;
    const result = { extracted: new Set(), visited };

    for (const child of children)
        for (const path of ((child || EMPTY)[key] || []))
        {
            if (track && result.visited.has(path))
                continue;

            result.extracted.add(path);

            if (!track)
                continue;

            if (result.visited === visited)
                result.visited = new Set(visited);

            result.visited.add(path);
        }

    return result;
}
