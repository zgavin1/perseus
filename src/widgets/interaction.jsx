/** @jsx React.DOM */

var Changeable   = require("../mixins/changeable.jsx");
var JsonifyProps = require("../mixins/jsonify-props.jsx");

var ColorPicker = require("./interaction/color-picker.jsx");
var DashPicker = require("./interaction/dash-picker.jsx");
var ElementContainer = require("./interaction/element-container.jsx");
var ExpressionEditor = require("./interaction/expression-editor.jsx");
var Graphie = require("../components/graphie.jsx");
var GraphSettings = require("../components/graph-settings.jsx");
var NumberInput = require("../components/number-input.jsx");
var TeX = require("../tex.jsx");

var Line = Graphie.Line;
var Point = Graphie.Point;


var Interaction = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
        graph: React.PropTypes.object,
        elements: React.PropTypes.arrayOf(React.PropTypes.object)
    },

    getDefaultProps: function() {
        return {};
    },

    _graphieSetup: function(graphie, options) {
        graphie.graphInit(_.extend(_.clone(options), {
            grid: _.contains(["graph", "grid"], this.props.graph.markings),
            axes: _.contains(["graph"], this.props.graph.markings),
            ticks: _.contains(["graph"], this.props.graph.markings),
            labels: _.contains(["graph"], this.props.graph.markings),
            labelFormat: function(s) { return "\\small{" + s + "}"; },
            axisArrows: "<->",
            unityLabels: false
        }));
        if (this.props.graph.markings === "graph") {
            var labels = this.props.graph.labels;
            var range = this.props.graph.range;
            graphie.label([0, range[1][1]], labels[1], "above");
            graphie.label([range[0][1], 0], labels[0], "right");
        }

    },

    _eval: function(expression, variables) {
        var expr = KAS.parse(expression).expr;
        if (!expr) {
            return 0;
        }
        val = expr.eval(variables);
        return val || 0;
    },

    render: function() {
        return <Graphie
                box={this.props.graph.box}
                range={this.props.graph.range}
                options={this.props.graph}
                setup={this._graphieSetup}>
            {_.map(this.props.elements, function(element, n) {
                if (element.type === "point") {
                    return <Point
                        key={element.key}
                        coord={[this._eval(element.options.coordX),
                            this._eval(element.options.coordY)]}
                        color={element.options.color} />;
                } else if (element.type === "line") {
                    var start = [this._eval(element.options.startX),
                                 this._eval(element.options.startY)];
                    var end = [this._eval(element.options.endX),
                               this._eval(element.options.endY)];
                    return <Line
                        start={start}
                        end={end}
                        style={{
                            stroke: element.options.color,
                            strokeWidth: element.options.strokeWidth,
                            strokeDasharray: element.options.strokeDasharray
                        }} />;
                }
            }, this)}
        </Graphie>;
    },

    simpleValidate: function(rubric) {
        return Interaction.validate(this.toJSON(), rubric);
    },

    statics: {
        displayMode: "block"
    }
});


_.extend(Interaction, {
    validate: function(state, rubric) {
        return {
            type: "points",
            earned: 1,
            total: 1,
            message: null
        };
    }
});


//
// Editor for non-interactive points
//
// TODO(eater): Factor this out maybe?
//
var PointEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
    },

    getDefaultProps: function() {
        return {
            coordX: "0",
            coordY: "0",
            color: KhanUtil.BLACK
        };
    },

    render: function() {
        return <div className="graph-settings">
            <div className="perseus-widget-row">
                Coordinate: <TeX>\Large(</TeX><ExpressionEditor
                    value={this.props.coordX}
                    onChange={this.change("coordX")} />
                <TeX>,</TeX> <ExpressionEditor
                    value={this.props.coordY}
                    onChange={this.change("coordY")} />
                <TeX>\Large)</TeX>
            </div>
            <div className="perseus-widget-row">
                <ColorPicker
                    value={this.props.color}
                    onChange={this.change("color")} />
            </div>
        </div>;
    }
});


//
// Editor for non-interactive line segments
//
// TODO(eater): Factor this out maybe?
//
var LineEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
    },

    getDefaultProps: function() {
        return {
            startX: "-5",
            startY: "5",
            endX: "5",
            endY: "5",
            color: KhanUtil.BLACK,
            strokeDasharray: "",
            strokeWidth: 2
        };
    },

    render: function() {
        return <div className="graph-settings">
            <div className="perseus-widget-row">
                Start: <TeX>\Large(</TeX><ExpressionEditor
                    value={this.props.startX}
                    onChange={this.change("startX")} />
                <TeX>,</TeX> <ExpressionEditor
                    value={this.props.startY}
                    onChange={this.change("startY")} />
                <TeX>\Large)</TeX>
            </div>
            <div className="perseus-widget-row">
                End: <TeX>\Large(</TeX><ExpressionEditor
                    value={this.props.endX}
                    onChange={this.change("endX")} />
                <TeX>,</TeX> <ExpressionEditor
                    value={this.props.endY}
                    onChange={this.change("endY")} />
                <TeX>\Large)</TeX>
            </div>
            <div className="perseus-widget-row">
                <ColorPicker
                    value={this.props.color}
                    onChange={this.change("color")} />
            </div>
            <div className="perseus-widget-row">
                <DashPicker
                    value={this.props.strokeDasharray}
                    onChange={this.change("strokeDasharray")} />
            </div>
            <div className="perseus-widget-row">
                <div className="perseus-widget-left-col">
                    Width: <NumberInput
                        value={this.props.strokeWidth}
                        placeholder={2}
                        onChange={this.change("strokeWidth")}/>
                </div>
            </div>
        </div>;
    }
});


var InteractionEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
        graph: React.PropTypes.object,
        elements: React.PropTypes.arrayOf(React.PropTypes.object)
    },

    getDefaultProps: function() {
        return {
            graph: {
                box: [400, 400],
                labels: ["x", "y"],
                range: [[-10, 10], [-10, 10]],
                tickStep: [1, 1],
                gridStep: [1, 1],
                markings: "graph",
            },
            elements: []
        };
    },

    _updateGraphProps: function(newProps) {
        // TODO(eater): GraphSettings should name this tickStep instead
        // of step. Grr..
        newProps.tickStep = newProps.step;
        delete newProps.step;

        this.change({graph: newProps});
    },

    _addNewElement: function(e) {
        var elementType = e.target.value;
        if (elementType === "") {
            return;
        }
        e.target.value = "";
        var newElement = {
            type: elementType,
            // TODO(eater): Is this the right time/place to apply key?
            key: _.uniqueId(elementType + "-"),
            options: elementType === "point" ?
                        PointEditor.originalSpec.getDefaultProps() :
                     elementType === "line" ?
                        LineEditor.originalSpec.getDefaultProps() : {}
        };
        this.change({
            elements: this.props.elements.concat(newElement)
        });
    },

    _deleteElement: function(key) {
        var element = _.findWhere(this.props.elements, {key: key})
        this.change({elements: _.without(this.props.elements, element)});
    },

    _moveElementUp: function(key) {
        var element = _.findWhere(this.props.elements, {key: key})
        var insertionPoint = _.indexOf(this.props.elements, element) - 1;
        var newElements = _.without(this.props.elements, element);
        newElements.splice(insertionPoint, 0, element);
        this.change({elements: newElements});
    },

    _moveElementDown: function(key) {
        var element = _.findWhere(this.props.elements, {key: key})
        var insertionPoint = _.indexOf(this.props.elements, element) + 1;
        var newElements = _.without(this.props.elements, element);
        newElements.splice(insertionPoint, 0, element);
        this.change({elements: newElements});
    },

    render: function() {
        return <div className="perseus-widget-interaction-editor">
            <ElementContainer title="Grid settings">
                <GraphSettings
                    editableSettings={["canvas", "graph"]}
                    box={this.props.graph.box}
                    labels={this.props.graph.labels}
                    range={this.props.graph.range}
                    step={this.props.graph.tickStep /*TODO(eater): grr names*/}
                    gridStep={this.props.graph.gridStep}
                    markings={this.props.graph.markings}
                    onChange={this._updateGraphProps} />
                {(this.props.graph.valid === true) || <div>
                    {this.props.graph.valid}
                </div>}
            </ElementContainer>
            {_.map(this.props.elements, function(element, n) {
                if (element.type === "point") {
                    return <ElementContainer
                            title={<span>Point <TeX>
                                    {"(" + element.options.coordX +
                                    ", " + element.options.coordY +
                                    ")"}</TeX>
                                </span>}
                            onUp={n === 0 ? null : this._moveElementUp}
                            onDown={n === this.props.elements.length - 1 ?
                                null : this._moveElementDown}
                            onDelete={this._deleteElement}
                            key={element.key}>
                        <PointEditor
                            coordX={element.options.coordX}
                            coordY={element.options.coordY}
                            color={element.options.color}
                            onChange={(newProps) => {
                                var elements = JSON.parse(JSON.stringify(
                                    this.props.elements));
                                _.extend(elements[n].options, newProps);
                                this.change({elements: elements});
                            }} />
                    </ElementContainer>;
                } else if (element.type === "line") {
                    return <ElementContainer
                            title={<span>Line <TeX>
                                    {"(" + element.options.startX +
                                    ", " + element.options.startY +
                                    ")"}</TeX> to <TeX>
                                    {"(" + element.options.endX +
                                    ", " + element.options.endY +
                                    ")"}</TeX>
                                </span>}
                            onUp={n === 0 ? null : this._moveElementUp}
                            onDown={n === this.props.elements.length - 1 ?
                                null : this._moveElementDown}
                            onDelete={this._deleteElement}
                            key={element.key}>
                        <LineEditor
                            startX={element.options.startX}
                            startY={element.options.startY}
                            endX={element.options.endX}
                            endY={element.options.endY}
                            color={element.options.color}
                            strokeDasharray={element.options.strokeDasharray}
                            strokeWidth={element.options.strokeWidth}
                            onChange={(newProps) => {
                                var elements = JSON.parse(JSON.stringify(
                                    this.props.elements));
                                _.extend(elements[n].options, newProps);
                                this.change({elements: elements});
                            }} />
                    </ElementContainer>;
                }
            }, this)}
            <div className="perseus-widget-interaction-editor-select-element">
                <select onChange={this._addNewElement}>
                    <option value="">Add an element{"\u2026"}</option>
                    <option disabled>--</option>
                    <option value="point">Point</option>
                    <option value="line">Line segment</option>
                </select>
            </div>
        </div>;
    }
});


module.exports = {
    name: "interaction",
    displayName: "Interaction",
    widget: Interaction,
    editor: InteractionEditor,
    transform: _.identity
};
