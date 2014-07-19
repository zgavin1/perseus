/** @jsx React.DOM */

var ButtonGroup = require("react-components/button-group");

var DashPicker = React.createClass({
    propTypes: {
        value: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            value: ""
        };
    },

    render: function() {
        return <ButtonGroup value={this.props.value}
            allowEmpty={false}
            buttons={[
            {value: "", text: <span>&mdash;</span>},
            {value: "-", text: <span>&ndash;&ndash;&ndash;</span>},
            {value: "- ", text: <span>&ndash;&nbsp;&nbsp;&ndash;</span>},
            {value: ".", text: <span>&middot;&middot;&middot;&middot;</span>},
            {value: ". ", text: <span>&middot; &middot; &middot;</span>}]}
            onChange={this.props.onChange} />;
    }
});

module.exports = DashPicker;
