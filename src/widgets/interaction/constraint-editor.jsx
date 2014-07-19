/** @jsx React.DOM */

var ButtonGroup = require("react-components/button-group");
var Changeable = require("../../mixins/changeable.jsx");
var ExpressionEditor = require("./expression-editor.jsx");
var NumberInput = require("../../components/number-input.jsx");
var TeX = require("../../tex.jsx");

var ConstraintEditor = React.createClass({
    mixins: [Changeable],

    propTypes: {
        constraint: React.PropTypes.string,
        snap: React.PropTypes.number,
        constraintFn: React.PropTypes.string,
        onChange: React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            constraint: "none",
            snap: 0.5,
            constraintFn: "0"
        };
    },

    render: function() {
        return <div>
            <div className="perseus-widget-row">
                Constraint: <ButtonGroup value={this.props.constraint}
                    allowEmpty={false}
                    buttons={[
                        {value: "none", text: "None"},
                        {value: "snap", text: "Snap"},
                        {value: "x",    text: "x="},
                        {value: "y",    text: "y="}]}
                    onChange={this.change("constraint")} />
            </div>
            {this.props.constraint === "snap" &&
                <div className="perseus-widget-row">
                    Snap: <NumberInput
                        value={this.props.snap}
                        placeholder={0}
                        onChange={this.change("snap")} />
            </div>}
            {this.props.constraint === "x" && <div className="graph-settings">
                <div className="perseus-widget-row">
                    <TeX>x=</TeX> <ExpressionEditor
                        value={this.props.constraintFn}
                        onChange={this.change("constraintFn")} />
                </div>
            </div>}
            {this.props.constraint === "y" && <div className="graph-settings">
                <div className="perseus-widget-row">
                    <TeX>y=</TeX> <ExpressionEditor
                        value={this.props.constraintFn}
                        onChange={this.change("constraintFn")} />
                </div>
            </div>}
        </div>;
    }
});

module.exports = ConstraintEditor;
