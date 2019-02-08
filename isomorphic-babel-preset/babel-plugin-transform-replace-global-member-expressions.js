const { hasOwnProperty } = Object;
const name = "transform-inline-global-expressions";
const None = { };


module.exports = function({ types: t }, replacements)
{
    const MemberExpression = function (path)
    {
        const { node, scope: { globals } } = path;

        if (node.computed)
            return;

        const { object } = node;

        if (!t.isIdentifier(object))
            return;
            
        const { name } = object;
        
        if (!path.scope.hasGlobal(name) ||
            !hasOwnProperty.call(replacements, name))
            return;

        const { replacedPath, replacement } = find(t, path, replacements[name]);
        const type = typeof replacement;

        if (type === "string")
            replacedPath.replaceWith(t.stringLiteral(replacement));

        else if (type === "boolean")
            replacedPath.replaceWith(t.booleanLiteral(replacement));
    };

    return { visitor: { MemberExpression } };
};

function find(t, path, replacements)
{
    const { node: expression, parentPath } = path;

    if (expression.computed)
        return None;

    const { property } = expression;
    const { name } = property;

    if (!hasOwnProperty.call(replacements, name))
        return None;

    const child = replacements[name];

    if (t.isMemberExpression(parentPath))
        return find(t, parentPath, child);
    
    return { replacedPath: path, replacement: child };
}
