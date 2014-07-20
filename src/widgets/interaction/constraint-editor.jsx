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
        onChange: React.PropTypes.func.isRequired,
        constraintXMin: React.PropTypes.string,
        constraintXMax: React.PropTypes.string,
        constraintYMin: React.PropTypes.string,
        constraintYMax: React.PropTypes.string
    },

    getDefaultProps: function() {
        return {
            constraint: "none",
            snap: 0.5,
            constraintFn: "0",
            constraintXMin: "-10",
            constraintXMax: "10",
            constraintYMin: "-10",
            constraintYMax: "10"
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
            Ensure these are set so nothing can be dragged off the canvas:
            <div className="perseus-widget-row">
                <div className="perseus-widget-row">
                    <TeX>x \in \Large[</TeX> <ExpressionEditor
                        value={this.props.constraintXMin}
                        onChange={this.change("constraintXMin")} />
                    <TeX>, </TeX> <ExpressionEditor
                        value={this.props.constraintXMax}
                        onChange={this.change("constraintXMax")}
                    /> <TeX>\Large]</TeX>
                </div>
            </div>
            <div className="perseus-widget-row">
                <div className="perseus-widget-row">
                    <TeX>y \in \Large[</TeX> <ExpressionEditor
                        value={this.props.constraintYMin}
                        onChange={this.change("constraintYMin")} />
                    <TeX>, </TeX> <ExpressionEditor
                        value={this.props.constraintYMax}
                        onChange={this.change("constraintYMax")}
                    /> <TeX>\Large]</TeX>
                </div>
            </div>
        </div>;
    }
});

module.exports = ConstraintEditor;
