/** @jsx React.DOM */
(function(Perseus) {

var SmartHintEditor = Perseus.SmartHintEditor = React.createClass({
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
                {_.map(self.props.smartHints, function (hint, i) {
                    return <li>
                        <button onClick={_.partial(
                                self.props.showSmartHint, i)}>Show</button>
                        {hint.hint} - {hint.percent}
                    </li>;
                })}
            </ul>
        </div>;
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
