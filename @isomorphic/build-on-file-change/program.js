

module.exports = function (aState, update, pull)
{
    var state = aState;

    return function push(anEvent)
    {
        state = update(state, anEvent);

        if (pull)
            pull(state);

        return state;
    }
}
