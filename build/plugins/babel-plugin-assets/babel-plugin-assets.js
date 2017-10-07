
const hasOwnProperty = Object.prototype.hasOwnProperty;
const parseOptions = require("./parse-options");
const relative = require("./relative");
const { dirname, join } = require("path");


module.exports = function ({ types: t, products })
{
    const script = subresource("script", { type: "text/javascript" });
    const link = subresource("link", { rel: "stylesheet", type: "text/css" });
    const img = subresource("img", { });
    const tags = { script, link, img, isomorphic };

    return { visitor: { JSXElement, CallExpression } };

    function JSXElement(path, state)
    {
        const { node } = path;
        const tag = node.openingElement.name.name;

        if (!hasOwnProperty.call(tags, tag))
            return;

        const { route } = parseOptions(state.opts || { });
        const source = state.file.opts.filename;
        const { replacement, task } = tags[tag](path, source, route) || { };

        if (replacement)
            path.replaceWith(replacement);

        if (task)
            getMetadata(path).push(task);
    }

    function CallExpression(path, state)
    {
        const node = path.node;

        if (!t.isIdentifier(node.callee, { name: "__COMPILED__" }))
            return;

        if (node.arguments.length !== 1)
            throw new Error("__COMPILED__ can only take one argument");

        const argument = node.arguments[0];

        if (!t.isLiteral(argument))
            throw new Error("__COMPILED__ can only take string argument");

        const { route } = parseOptions(state.opts || { });
        const source = state.file.opts.filename;
        const task = route(rooted(source, argument.value), true);

        getMetadata(path).push(task);

        path.replaceWith(tString(relative(dirname(source), task.output)));
    }

    function subresource(tag, defaults)
    {
        const toAttribute = (name, string) =>
            t.JSXAttribute(t.JSXIdentifier(name), t.StringLiteral(string));
        const defaultAttributes = Object
            .keys(defaults)
            .map(name => toAttribute(name, defaults[name]));

        return function ({ node }, source, route)
        {
            // An element may have multiple copies of the same attribute,
            // as well as spread elements. This returns the last (and thus
            // "effective", copy of each.
            const openingElement = node.openingElement;
            const [extracted, attributes] = partitionAttributes(
                ["asset", "compile"], openingElement.attributes);
            const assetAttribute = getOnlyStringLiteral(extracted["asset"]);
            const compileAttribute = getOnlyStringLiteral(extracted["compile"]);

            if (assetAttribute && compileAttribute)
                throw new TypeError("Can't have both asset and compile attributes.");

            if (!assetAttribute && !compileAttribute)
                return;

            const attribute = (assetAttribute || compileAttribute);
            const input = rooted(source, attribute.value.value);
            const task = route(input, !!compileAttribute);
            const replacement = tAssign(node,
            {
                openingElement: tAssign(openingElement,
                {
                    attributes: defaultAttributes
                        .concat(attributes, tAssetCall({ ...task, tag }))
                })
            });

            return { replacement, task };
        }
    }

    function isomorphic({ node, scope }, source, route)
    {
        const task = route(source, true);
        const uid = scope.generateUidIdentifier("uid");
        const name = t.JSXIdentifier(uid.name);
        const openingElement = tAssign(node.openingElement,
        {
            name,
            attributes: node.openingElement.attributes.concat(tAssetCall(task))
        });
        const closingElement = tAssign(node.closingElement, { name });
        const element = tAssign(node, { openingElement, closingElement });
        const replacement = t.callExpression(
            t.arrowFunctionExpression([uid], element),
            [tRequire("./isomorphic")]);

        return { replacement, task };
    }

    function tRequire(path)
    {
        return t.callExpression(t.identifier("require"), [tString(path)]);
    }

    function tAssetCall(object)
    {
        return t.JSXSpreadAttribute(t.callExpression(
            tRequire("./asset"), [t.valueToNode(object)]));
    }

    function tString(string)
    {
        return t.stringLiteral(string);
    }

    function tAssign(node, properties)
    {
        return t[node.type](...
            t.BUILDER_KEYS[node.type].map(key =>
                hasOwnProperty.call(properties, key) ?
                properties[key] : node[key]));
    }

    function rooted(source, path)
    {
        if (path.substr(0, "~/".length) === "~/")
            return path;

        return relative(dirname(source), path);
    }

    function partitionAttributes(names, attributes)
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

    function getOnlyStringLiteral(attributes)
    {
        if (attributes.length <= 0)
            return false;

        if (attributes.length > 1)
            throw new TypeError("Can only have one tag");

        const last = attributes[attributes.length - 1];

        if (!t.isStringLiteral(last.value))
            throw new TypeError(last.value.value + " must be a string literal");

        return last;
    }

    function getMetadata(path)
    {
        const metadata = path.hub.file.metadata;

        if (!metadata["plugins"])
            metadata["plugins"] = { };

        if (!metadata["plugins"]["babel-plugins-assets"])
            metadata["plugins"]["babel-plugins-assets"] = [];

        return metadata["plugins"]["babel-plugins-assets"];
    }
}
