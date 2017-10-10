
const { join, normalize } = require("path");
const isAbsolute = path => path.substr(0, "~/".length) === "~/";
const ofSize = length => Array.from({ length });


module.exports = function relative(from, to)
{
    const fromAbsolute = isAbsolute(from);
    const toAbsolute = isAbsolute(to);

    if (!fromAbsolute && toAbsolute)
        return to;
    
    if (fromAbsolute && !toAbsolute)
        return normalize(join(from, to));

    const fromComponents = from.split("/").filter(x => !!x);
    const toComponents = to.split("/").filter(x => !!x);
    const different = fromComponents.findIndex(
        (item, index) => item !== toComponents[index]);
    const backtrack = different < 0 ? fromComponents.length : different;

    const lhs = join(...ofSize(fromComponents.length - backtrack).map(() => ".."));
    const rhs = join(...toComponents.slice(backtrack));
    
    return join(lhs, rhs);
}