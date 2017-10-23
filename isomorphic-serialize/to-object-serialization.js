
var Call = (Function.prototype.call).bind(Function.prototype.call);

var I = require("immutable");

var Map = global.Map || require("native-map");
var Set = global.Set || false;

var MapGet = Map.prototype.get;
var MapSet = Map.prototype.set;

var MathLog = Math.log;
var MathLN10 = Math.LN10;

var ObjectKeys = Object.keys;

var types = require("./types");

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
};

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
        return UID; // iF the UID already exists the object has already been encoded.

    Call(MapSet, UIDs, anObject, UID);

    if (type === "boolean" ||
        type === "number" ||
        type === "string")
        aContext.objects[UID] = anObject;
    else
    {
        aContext.objects[UID] = null;

        var tail = { UID: UID, object: anObject };

        if (aContext.tail)
            aContext.tail.next = tail;

        aContext.tail = tail;
    }

    return UID;
}


function completeObjectSerialization(anObject, aUID, aContext)
{
    var type = types.getType(anObject);

    var serializer = types.isImmutableType(type) ? serializeImmutable : serializeObject;
    serializer(anObject, type, aUID, aContext);
}

function serializeObject(anObject, type, aUID, aContext)
{
    var serializedObject = [type];

    var keys = ObjectKeys(anObject);
    var count = keys.length;
    var index = 0;

    for (; index < count; ++index)
    {
        var key = keys[index];
        var object = anObject[key];

        var serializedValue = toObjectSerialization(object, aContext);
        var potentiallySerializedKey = UIDForKey(key, aContext);

        serializedObject.push(potentiallySerializedKey, serializedValue);
    }

    var isSetOrMap = type === 2 || type === 3;

    if (isSetOrMap)
        serializeKeys(serializedObject, anObject, type, aUID, aContext);

    aContext.objects[aUID] = serializedObject;
}


function serializeImmutable(anObject, type, aUID, aContext)
{
    var serializedObject = [type];
    serializeKeys(serializedObject, anObject, type, aUID, aContext);
    aContext.objects[aUID] = serializedObject;
}

// This will serialize the values in JS Maps and Sets, and all immutable collections.
function serializeKeys(serializedObject, anObject, type, aUID, aContext)
{
    var keys = I.Seq(anObject.keys());
    var count = keys.count();
    var index = 0;

    for (; index < count; ++index)
    {
        var key = keys.get(index);
        var object = get(key, anObject);
        var serializedValue = toObjectSerialization(object, aContext);

        // Don't store duplicate data from Sets.
        if (type !== 3 && type !== 6)
        {
            var potentiallySerializedKey = UIDForKey(key, aContext);
            serializedObject.push(potentiallySerializedKey);
        }

        serializedObject.push(serializedValue);
    }

    function get(aKey, anObject)
    {
        return anObject instanceof Set ? aKey : anObject.get(aKey);
    }
}

function UIDForKey(aKey, aContext)
{
    var UIDForKey = Call(MapGet, aContext.UIDs, aKey);

    if (typeof UIDForKey === "undefined")
        UIDForKey = aContext.UIDs.size;

    // All non-strings must go through serialization.
    if (typeof aKey !== "string")
        return toObjectSerialization(aKey, aContext, UIDForKey, true);

    // If the string is shorter than the UUID, just inline the key.
    return MathLog(UIDForKey) / MathLN10 < aKey.length + 2
           ? toObjectSerialization(aKey, aContext, UIDForKey, true)
           : aKey;
}
