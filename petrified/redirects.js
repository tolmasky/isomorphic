const React = require("react");

const fs = require("sf-fs");
const { dirname } = require("path");

const render = require("./transform/react-element");


module.exports = function redirects({ destination, components, children })
{
    const redirect = components["redirect"];

    for (const page of children)
    {
        const froms = page && (page["redirect-from"] || page["redirect_from"]);

        // FIXME: Should we put this in a tag?
        // FIXME: resolve this path.
        for (const from of froms && [].concat(froms) || [])
        {
            fs.mkdirp(dirname(`${destination}/${from}`));
            fs.write(`${destination}/${from}`,
                render(React.createElement(redirect(), { page })),
                "utf-8");
        }
    }

    return children;
}
