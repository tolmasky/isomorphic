
const { base, attrs } = require("./generic-jsx");
const hasOwnProperty = Object.prototype.hasOwnProperty;
const NameAttribute = Symbol("StateNameAttribute"); 


module.exports = state;

function state(name)
{
    return name;
}

state.name = NameAttribute;

state.on = function on(name)
{
    return name;
}

state.state = state;

state.machine = function machine([name], states)
{
    if (arguments.length < 2)
        return states => machine([name], states)

    Object.keys(states).reduce((update, key) =>
        Object.assign(update,
            { [key]: <update { ...{ [NameAttribute]: key } }/> }),
        update);

    Object.keys(states).map(key =>
        Object.keys(states).reduce((state, key) =>
            Object.assign(state, { [key]: update[key] }),
            update[key]));

    Object.defineProperty(update, "name", { value: name });

    return update.initial;

    function update (state)
    {
        const { [NameAttribute]: name, event } = state;
        const events = states[name];

        if (event.name !== ReplaceChildEvent)
        {
            if (!hasOwnProperty.call(events, event.name))
                throw new Error(`State ${name} can't handle event ${event.name}.`);

            return states[name][event.name](state);
        }

        const { index, child } = event;
        const { children } = state;

        const previousChildStateName = attrs(children[index])[NameAttribute];
        const proposedChildStateName = attrs(child)[NameAttribute];

        const updatedChildren = ((index, child, children) => 
            (children.splice(index, 1, child), children))
            (children.slice());

        if (previousChildStateName === proposedChildStateName)
            return <machine { ...state } children = { updatedChildren }/>;

        const observedEventName = `#${ref}.${proposedChildStateName}`;

        return <machine { ...state }
                    event = { { ...event, name:observedEventName } }
                    children = { updatedChildren } />;        
    } 
}

state.debug = function (state)
{
    return base(state).name + "[" + attrs(state)[NameAttribute] + "]";
}
