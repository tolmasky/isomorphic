const hasOwnProperty = Object.prototype.hasOwnProperty;
const EMPTY = { };

module.exports = MUIDStore;

function MUIDStore(toKey)
{
    this.toKey = toKey;
    this.MUIDs = Object.create(null);
    this.future = key => get(key, this);
}

MUIDStore.prototype.for = function (value)
{
    const muid = get(this.toKey(value), this);

    if (muid.value === EMPTY)
        muid.value = value;

    return muid;
}

function get(key, store)
{
    const muid = store.MUIDs[key] || (store.MUIDs[key] = new MUID());

    ++muid.count;

    return muid;
}

MUIDStore.prototype.finalize = function ()
{
    const MUIDs = this.MUIDs;

    return Object.keys(MUIDs)
        .sort((lhs, rhs) => MUIDs[rhs].count - MUIDs[lhs].count)
        .map(function (key, index)
        {
            MUIDs[key].position = index;

            return MUIDs[key].value;
        });
}

function MUID(value)
{
    this.value = EMPTY;
    this.count = 0;
    this.position = -1;
}

MUID.prototype.toJSON = function()
{
    return this.position;
}