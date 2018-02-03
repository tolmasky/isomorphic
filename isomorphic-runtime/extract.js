
const hasOwnProperty = Object.prototype.hasOwnProperty;


module.exports = function({ key, children })
{
    return children
        .filter(child => child && hasOwnProperty.call(child, key))
        .map(child => child[key]);
}
