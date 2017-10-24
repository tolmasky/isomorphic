
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

    var UIDs = context.UIDs;
    var serializedObjects = [];

    analyzeUIDs(UIDs).forEach(function(aUID)
    {
        var serializedLocation = aUID.serializedLocation;
        var serializedObject = context.objects[serializedLocation];
        serializedObjects[aUID.__UNIQUE_ID] = serializedObject;
    });

    return { index:UID, objects:serializedObjects };
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
    var UID = UIDForValue(anObject, UIDs);

    if (UID)
        return UID.increment(); // iF the UID already exists the object has already been encoded.

    UID = new UIDWrapper(hasHint && aUIDHint);

    Call(MapSet, UIDs, anObject, UID);

    if (type === "boolean" ||
        type === "number" ||
        type === "string")
        aContext.objects[UID.serializedLocation] = anObject;
    else
    {
        aContext.objects[UID.serializedLocation] = null;

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
        var serializedKey = toObjectSerialization(key, aContext);

        serializedObject.push(serializedKey, serializedValue);
    }

    var isSetOrMap = type === 2 || type === 3;

    if (isSetOrMap)
        serializeKeys(serializedObject, anObject, type, aUID, aContext);

    aContext.objects[aUID.serializedLocation] = serializedObject;
}


function serializeImmutable(anObject, type, aUID, aContext)
{
    var serializedObject = [type];
    serializeKeys(serializedObject, anObject, type, aUID, aContext);
    aContext.objects[aUID.serializedLocation] = serializedObject;
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
            var serializedKey = toObjectSerialization(key, aContext.UIDs, key, true);
            serializedObject.push(serializedKey);
        }

        serializedObject.push(serializedValue);
    }

    function get(aKey, anObject)
    {
        return anObject instanceof Set ? aKey : anObject.get(aKey);
    }
}

function UIDForValue(aValue, UIDs)
{
    return Call(MapGet, UIDs, aValue);
}


var UIDCount = 0;

function UIDWrapper(potentialKeyID)
{
    this.serializedLocation = UIDCount;
    this.references = 1;
    this.potentialKeyID = typeof potentialKeyID === "string" && potentialKeyID;
    UIDCount++;
}

UIDWrapper.prototype.toJSON = function()
{
    // console.log("TEESTING>>>>", this);
    return this.__UNIQUE_ID;
};

UIDWrapper.prototype.increment = function()
{
    this.references += 1;
    return this;
};

function analyzeUIDs(UIDsMap)
{
    var UIDs = Array.from(UIDsMap.values());

    // console.log("SORT THIS SHIT", UIDsMap);

    UIDs.sort(function(a, b)
    {
        return b.references - a.references;
    });

    var offset = 0;

    UIDs.forEach(function(aUID, anIndex)
    {
        var potentialID = anIndex - offset;
        var potentialKeyID = aUID.potentialKeyID;

        var canStoreAsString = typeof potentialKeyID === "string";
        var isShorterAsString = canStoreAsString && MathLog(potentialID) / MathLN10 > potentialKeyID.length + 2;

        if (isShorterAsString)
        {
            aUID.__UNIQUE_ID = potentialKeyID;
            offset++;
        }
        else
            aUID.__UNIQUE_ID = potentialID;
    });

    return UIDs;
}