/** @jsx React.DOM */
(function(Perseus) {

var SmartHintEditor = Perseus.SmartHintEditor = React.createClass({
    getInitialState: function() {
        var self = this;
        this.item = this.props.item;
        this.item.onChange(function () {
            self.setState({count: self.state.count + 1});
        });
        return {
            count: 0
        };
    },
    
    render: function () {
        var self = this;
        return <div>
            <h3>Smart Hints and stuff:</h3>
            <div>
                <button onClick={self.props.changeCorrectAnswer}>Set Correct</button>
                <button onClick={self.addSmartHint}>Add Smart Hint</button>
            </div>
            <div>
                <label>Smart Hint text:
                    <input ref="smart-hint-text" type="text"/>
                </label>
            </div>
            <div>
                <button onClick={self.props.showCorrect}>Show Correct</button>
            </div>
            <ul>
                
                {_.map(self.orderSmartHint(self.item.smartHints), function (hint) {
                    return <li>
                        <button onClick={_.partial(
                                self.props.showSmartHint, hint.id)}>Show</button>
                        {hint.hint} - {hint.percent}
                    </li>;
                })}
            </ul>
        </div>;
    },

    orderSmartHint: function(hints) {
        var percents = Object.keys(hints).map(function(id) {
                        return {id: id, hint: hints[id].hint, percent: hints[id].guesses.map(function(val) {
                            return val.percent;}).reduce( function(previousValue, currentValue) {
                        return previousValue + currentValue;})
                    };
                });
        return orderedPercents= percents.sort(function(a,b) {
            return b.percent - a.percent;
        });
    },
    
    addSmartHint: function () {
        var value = this.refs["smart-hint-text"].getDOMNode().value;

        // TODO(jakesandlund): need a better way to do this
        if (!value) {
            window.alert("Enter some hint text");
            return;
        }
        this.props.addSmartHint(value);
    }
});

})(Perseus);
