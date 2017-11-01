
var Call = (Function.prototype.call).bind(Function.prototype.call);

var Map = global.Map || require("native-map");

var ArraySort = Array.prototype.sort;
var MapGet = Map.prototype.get;
var MapSet = Map.prototype.set;

var MathLog = Math.log;
var MathLN10 = Math.LN10;

var undefined = void 0;

var types = require("./types");

module.exports = function(anObject)
{
    var context = { UIDs: new Map(), UIDList: [], objects:[], types: Object.create(null) };
    var UID = toObjectSerialization(anObject, context);
    var list = context.tail;

    while (list)
    {
        completeObjectSerialization(list.object, list.UID, context);

        list = list.next;
    }

    var serializedObjects = [];

    // Sort the types.
    var typeMap = types.analyzeTypes(context);
    // Sort the serialized objects.
    analyzeUIDs(context.UIDList, function(aUID)
    {
        var serializedLocation = aUID.serializedLocation;
        var serializedObject = context.objects[serializedLocation];
        serializedObjects[aUID.__UNIQUE_ID] = serializedObject;
    });

    return { index: UID, objects: serializedObjects, typeMap: typeMap };
};

function toObjectSerialization(anObject, aContext, aUIDHint, hasHint)
{
    if (anObject === null)
        return -1;

    if (anObject === undefined)
        return -2;

    var type = typeof anObject;

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
    var UID = Call(MapGet, UIDs, anObject);

    if (UID)
        return UID.increment(); // If the UID already exists the object has already been encoded.

    UID = new UIDWrapper(hasHint && aUIDHint, aContext);
    Call(MapSet, UIDs, anObject, UID);

    if (type === "string" ||
        type === "number" ||
        type === "boolean")
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

var getInternalType = types.getInternalType;
var encodableType = types.encodableType;
var serializers = types.serializers;

function completeObjectSerialization(anObject, aUID, aContext)
{
    var internalType = getInternalType(anObject);
    var serializedType = encodableType(internalType, aContext);

    serializedType.increment();

    var serializedObject = [serializedType];
    var serializer = serializers[internalType];

    aContext.objects[aUID.serializedLocation] = serializer(serializedObject, anObject, aContext, toObjectSerialization);
}

function UIDWrapper(potentialKeyID, aContext)
{
    var size = aContext.UIDs.size;
    this.serializedLocation = size;
    this.references = 1;
    this.potentialKeyID = typeof potentialKeyID === "string" && potentialKeyID;
    aContext.UIDList[size] = this;
}

UIDWrapper.prototype.toJSON = function()
{
    return this.__UNIQUE_ID;
};

UIDWrapper.prototype.increment = function()
{
    this.references += 1;
    return this;
};

function analyzeUIDs(UIDs, aFunction)
{
    Call(ArraySort, UIDs, function(a, b)
    {
        return b.references - a.references;
    });

    var offset = 0,
        i = 0,
        count = UIDs.length;

    for (; i < count; i++)
    {
        var aUID = UIDs[i];
        var potentialID = i - offset;
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

        aFunction(aUID);
    }

    return UIDs;
}
