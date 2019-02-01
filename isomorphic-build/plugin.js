const { data, string, parameterized } = require("@algebraic/type");
const { Cause, field, event } = require("@cause/cause");

const Request = data `Request` (
    input           => string );


const Plugin = Cause(`Plugin`,
{
    [field `path`]: -1,
    [field `cache`]: -1,

/*    [event.on (Cause.Start)]: (plugin)
    {
        console.log("hi...");
        return [
    },*/
    [event._on (Request)]: (plugin, { input }) =>
    {
    try {
        const x = [plugin, [require("@isomorphic/compile-javascript")({ input, cache:plugin.cache, options: { presets:[[require.resolve("@isomorphic/babel-preset"), { browser:true, react:true }]]} })]]
        
        return x;
        }
    catch (e)
    {
        console.log(e);
    } }
});

Plugin.Request = Request;

module.exports = Plugin;
