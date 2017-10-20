
var Call = (Function.prototype.call).bind(Function.prototype.call);

var I = require("immutable");

var isArray = Array.isArray;

var Map = global.Map || require("native-map");    
var MapGet = Map.prototype.get;
var MapSet = Map.prototype.set;

var MathLog = Math.log;
var MathLN10 = Math.LN10

var ObjectKeys = Object.keys;

var calls = 0;

module.exports = function(anObject)
{
    var context = { UIDs: new Map(), objects:[] };
    var UID = toObjectSerialization(anObject, context);
    var list = context.tail;

    while (list)
    {
        completeObjectSerialization(list.object, list.UID, context);
        
        list = list.next;
    }

    return { index:UID, objects:context.objects };
}

function toObjectSerialization(anObject, aContext, aUIDHint, hasHint)
{
    if (anObject === null)
        return -1;

    var type = typeof anObject;

    if (type === "undefined")
        return -2;

    if (type === "number")
    {
        // NaN
        if (anObject !== anObject)
            return -3;

        // -0
        if (anObject === 0 && 1 / anObject === -Infinity)
            return -4;

        // -Infinity
        if (anObject === -Infinity)
            return -5;

        // Infinity
        if (anObject === Infinity)
            return -6;
    }

    var UIDs = aContext.UIDs;
    var UID = hasHint ? aUIDHint : Call(MapGet, UIDs, anObject);
    
    if (typeof UID === "undefined")
        UID = UIDs.size;

    else if (UID < UIDs.size)
        return UID;

    Call(MapSet, UIDs, anObject, UID);

    if (    type === "boolean" ||
            type === "number" ||
            type === "string")
        aContext.objects[UID] = anObject;
    else
    {
        aContext.objects[UID] = null;
        
        var tail = { UID:UID, object:anObject };
        
        if (aContext.tail)
            aContext.tail.next = tail;
    
        aContext.tail = tail;
    }

    return UID;
}

function completeObjectSerialization(anObject, aUID, aContext)
{
    var isCollection = I.Map.isMap(anObject) || I.List.isList(anObject);
    var serializedObject = [isArray(anObject) || isCollection && I.List.isList(anObject) ? 1 : 0];
    var keys = isCollection ? I.Seq(anObject.keys()) : ObjectKeys(anObject);
    var index = 0;
    var count = isCollection ? keys.count() : keys.length;

    for (; index < count; ++index)
    {
        var key = isCollection ? keys.get(index) + "" : keys[index];
        var object = isCollection ? anObject.get(key) : anObject[key];
        var serialized = toObjectSerialization(object, aContext);
        var UIDForKey = Call(MapGet, aContext.UIDs, key);
        
        if (typeof UIDForKey === "undefined")
            UIDForKey = aContext.UIDs.size;//UIDForObject(anObject, UIDs);

        var potentiallySerializedKey = MathLog(UIDForKey)/MathLN10 < key.length + 2 ?
            toObjectSerialization(key, aContext, UIDForKey, true) : key;

        serializedObject.push(potentiallySerializedKey, serialized);
    }

    aContext.objects[aUID] = serializedObject;
};
