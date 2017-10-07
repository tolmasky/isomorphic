
const { isValidElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const express = require("express");
const verbs = ["get", "post", "put"];


module.exports = Object.assign(function ()
{
    return verbs.reduce((server, verb) =>
        Object.assign(server, { [verb]: wrap(server[verb],verb) }),
        express.apply(this, arguments));
}, express);

function wrap(method,verb)
{
    const wrapper = handler =>
        (...args) => tryCatch(reactRender(handler))(...args);

    return function (route, handler, ...rest)
    {
        const wrapped = wrapper(handler);
        const args = [route, wrapped, ...rest];
    
        // Express gets angry if we send undefined for the 2nd element,
        // because it relies on arguments.length to determine if a function
        // was passed in. So make sure our argument counts match.
        return method.apply(this, args.slice(0, arguments.length));
    }
}

function reactRender(handler)
{
    return async function (request, response, next)
    {
        const element = await handler.apply(this, arguments);

        if (!isValidElement(element))
            return;

        response.set("Content-Type", "text/html;charset=utf-8");
        response.send("<!DOCTYPE html>" + renderToStaticMarkup(element));
    };
}

function tryCatch(handler)
{
    return async function (request, response, next)
    {
        try
        {
            await handler.apply(this, arguments);
        }
        catch (error)
        {
            next(error);
        }
    }
}
