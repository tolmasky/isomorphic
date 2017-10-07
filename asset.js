
const checksums = { };
const URLKeys = { "script": "src", "link": "href", "img": "src" };


module.exports = function ({ URL, tag })
{
    const integrity = checksums[URL];
    const bustedURL = URL + `?integrity=${integrity}`;
    const crossOrigin = "anonymous";

    return { [URLKeys[tag] || "URL"]:  bustedURL, integrity, crossOrigin };
}
