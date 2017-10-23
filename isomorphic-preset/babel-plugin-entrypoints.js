

const hasOwnProperty = Object.prototype.hasOwnProperty;
const { dirname, join, normalize } = require("path");


module.exports = function ({ types: t })
{
    const script = subresource(t, "script", { type: "text/javascript" });
    const link = subresource(t, "link", { rel: "stylesheet", type: "text/css" });
    const img = subresource(t, "img", { });
    const html = subresource(t, "html", { }, true);
    const tags = { script, link, img, html };

    return { manipulateOptions, visitor: { JSXElement, CallExpression } };

    function JSXElement(path, state)
    {
        const { node } = path;
        const tag = node.openingElement.name.name;

        if (!hasOwnProperty.call(tags, tag))
            return;
console.log(tags[tag](path, state.file.metadata["isomorphic"]));
        path.replaceWith(tags[tag](path, state.file.metadata["isomorphic"]));
    }

    function CallExpression(path, state)
    {
        const node = path.node;

        if (!t.isIdentifier(node.callee, { name: "__ENTRYPOINT__" }))
            return;

        if (node.arguments.length !== 1)
            throw new Error("__ENTRYPOINT__ can only take one argument");

        const argument = node.arguments[0];

        if (!t.isLiteral(argument))
            throw new Error("__ENTRYPOINT__ can only take string argument");

        const entrypoint = argument.value;
        const { entrypoints } = state.file.metadata["isomorphic"];

        entrypoints.add(entrypoint);

        path.replaceWith(tRuntimeResolve(t, entrypoint));
    }    
}

function subresource(t, tag, defaults, wrap)
{
    const toAttribute = (name, string) =>
        t.JSXAttribute(t.JSXIdentifier(name), t.StringLiteral(string));
    const defaultAttributes = Object
        .keys(defaults)
        .map(name => toAttribute(name, defaults[name]));

    return function (path, metadata)
    {
        const { node } = path;
        // An element may have multiple copies of the same attribute,
        // as well as spread elements. This returns the last (and thus
        // "effective", copy of each.
        const openingElement = node.openingElement;
        const [extracted, attributes] = partitionAttributes(
            t, ["asset", "entrypoint"], openingElement.attributes);
        const assetAttribute = getOnlyStringLiteral(t, extracted["asset"]);
        const entrypointAttribute = getOnlyStringLiteral(t, extracted["entrypoint"]);

        if (assetAttribute && entrypointAttribute)
            throw new TypeError("Can't have both asset and entrypoint attributes.");

        if (!assetAttribute && !entrypointAttribute)
            return node;

        const attribute = (assetAttribute || entrypointAttribute);
        const entrypoint = attribute.value.value;

        metadata.entrypoints.add(entrypoint);

        const modifiedAttributes = defaultAttributes
            .concat(attributes, tInlineAssetAttributes(t, tag, entrypoint));
        const modifiedOpeningElement = tAssign(t, openingElement,
            { attributes: modifiedAttributes });
        const modifiedNode = tAssign(t, node,
            { openingElement: modifiedOpeningElement });

        if (!wrap)
            return modifiedNode;

        return tRequiredElement(t, modifiedNode, path.scope);
    }
}

function partitionAttributes(t, names, attributes)
{
    const matches = names.reduce((matches, name) =>
        Object.assign(matches, { [name]: [] }), { });
    const has = hasOwnProperty.bind(matches);
    const excluded = [];

    for (const attribute of attributes)
        if (t.isJSXAttribute(attribute) && has(attribute.name.name))
            matches[attribute.name.name].push(attribute);
        else
            excluded.push(attribute);

    return [matches, excluded];
}

function getOnlyStringLiteral(t, attributes)
{
    if (attributes.length <= 0)
        return false;

    if (attributes.length > 1)
        throw new TypeError("Can only have one attribute");

    const last = attributes[attributes.length - 1];

    if (!t.isStringLiteral(last.value))
        throw new TypeError(last.value.value + " must be a string literal");

    return last;
}

function tAssign(t, node, properties)
{
    return t[node.type](...
        t.BUILDER_KEYS[node.type].map(key =>
            hasOwnProperty.call(properties, key) ?
            properties[key] : node[key]));
}

function tRequiredElement(t, node, scope)
{
    const { openingElement, closingElement } = node;
    const tag = openingElement.name.name;
    const identifier = scope.generateUidIdentifier("_" + tag);
    const name = t.JSXIdentifier(identifier.name);
    const renamed = tAssign(t, node,
    {
        openingElement: tAssign(t, openingElement, { name }),
        closingElement: closingElement && tAssign(closingElement, { name })
    });

    return t.callExpression(
        t.arrowFunctionExpression([identifier], renamed),
        [tInternalRequire(t, tag)]);
}

function tInlineAssetAttributes(t, tag, entrypoint)
{
    return t.JSXSpreadAttribute(
        t.callExpression(
            tInternalRequire(t, "inline-asset-attributes"),
            [t.stringLiteral(tag), tRuntimeResolve(t, entrypoint)]));
}

function tRuntimeResolve(t, path)
{
    const require = t.identifier("require");

    return t.callExpression(
        tInternalRequire(t, "resolve"),
        [t.callExpression(
            t.memberExpression(require, t.identifier("resolve")),
            [t.stringLiteral(path)])]);
}

function tInternalRequire(t, path)
{
    return t.callExpression(
        t.identifier("require"),
        [t.stringLiteral(`isomorphic/internal/${path}`)]);
}

function manipulateOptions(_, parserOpts)
{
    parserOpts.plugins.push("jsx");
}

