
const React = require("react");

module.exports = function ()
{
    return  <html>
                <head>
                    <title>HELLO!</title>
                </head>
                <body>
                    <isomorphic>
                        <Counter/>
                    </isomorphic>
                </body>
            </html>
}

class Counter extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = { count: 0 };
    }

    render()
    {
        return  <div>
                    The Count is: { this.state.count }
                    <input  type = "button"
                            value = "up!"
                            onClick = { () => this.setState({ count: this.state.count + 1 }) }/>
                </div>;
    }
}