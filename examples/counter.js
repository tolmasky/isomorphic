
const React = require("react");


module.exports = class Counter extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = { count: 0 };
    }

    render()
    {
        return  <html>
                    <head>
                        <title>{ this.state.count }</title>
                        <link entrypoint = "./styles.less" />
                    </head>
                    <body>
                        <isomorphic>
                            The Count is: { this.state.count }
                            <input  type = "button"
                                    value = "up!"
                                    onClick = { () => this.setState({ count: this.state.count + 1 }) }/>
                        </isomorphic>
                    </body>
                </html>;
    }
}