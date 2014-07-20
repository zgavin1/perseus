/** @jsx React.DOM */

var Changeable   = require("../mixins/changeable.jsx");
var JsonifyProps = require("../mixins/jsonify-props.jsx");

var ArrowPicker = require("./interaction/arrow-picker.jsx");
var ColorPicker = require("./interaction/color-picker.jsx");
var ConstraintEditor = require("./interaction/constraint-editor.jsx");
var DashPicker = require("./interaction/dash-picker.jsx");
var ElementContainer = require("./interaction/element-container.jsx");
var ExpressionEditor = require("./interaction/expression-editor.jsx");
var Graphie = require("../components/graphie.jsx");
var GraphSettings = require("../components/graph-settings.jsx");
var NumberInput = require("../components/number-input.jsx");
var TeX = require("../tex.jsx");

var Line = Graphie.Line;
var MovablePoint = Graphie.MovablePoint;
var MovableLine = Graphie.MovableLine;
var Plot = Graphie.Plot;
var PlotParametric = Graphie.PlotParametric;
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

    getInitialState: function() {
        return {
            variables: this._getInitialVariables(this.props.elements),
            functions: this._getInitialFunctions(this.props.elements)
        };
    },

    _getInitialVariables: function(elements) {
        var variables = {};
        // TODO(eater): look at all this copypasta! refactor this!
        _.each(_.where(elements, {type: "movable-point"}), function(element) {
            var subscript = element.options.varSubscript;
            var startXExpr = KAS.parse(element.options.startX || "0").expr;
            var startYExpr = KAS.parse(element.options.startY || "0").expr;
            var startX = 0;
            var starty = 0;
            if (startXExpr) {
                startX = startXExpr.eval({}) || 0;
            }
            if (startYExpr) {
                startY = startYExpr.eval({}) || 0;
            }
            variables["x_" + subscript] = startX;
            variables["y_" + subscript] = startY;
        }, this);
        _.each(_.where(elements, {type: "movable-line"}), function(element) {
            var startSubscript = element.options.startSubscript;
            var endSubscript = element.options.endSubscript;
            var startXExpr = KAS.parse(element.options.startX || "0").expr;
            var startYExpr = KAS.parse(element.options.startY || "0").expr;
            var endXExpr = KAS.parse(element.options.endX || "0").expr;
            var endYExpr = KAS.parse(element.options.endY || "0").expr;
            var startX = 0;
            var starty = 0;
            var endX = 0;
            var endy = 0;
            if (startXExpr) {
                startX = startXExpr.eval({}) || 0;
            }
            if (startYExpr) {
                startY = startYExpr.eval({}) || 0;
            }
            if (endXExpr) {
                endX = endXExpr.eval({}) || 0;
            }
            if (endYExpr) {
                endY = endYExpr.eval({}) || 0;
            }
            variables["x_" + startSubscript] = startX;
            variables["y_" + startSubscript] = startY;
            variables["x_" + endSubscript] = endX;
            variables["y_" + endSubscript] = endY;
        }, this);
        _.each(_.where(elements, {type: "function"}), function(element) {
            variables[element.options.funcName] = element.options.value;
        });
        return variables;
    },

    _getInitialFunctions: function(elements) {
        return _.map(_.where(elements, {type: "function"}),
            (element) => element.options.funcName);
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            variables: this._getInitialVariables(nextProps.elements),
            functions: this._getInitialFunctions(nextProps.elements)
        });
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

    _updatePointLocation: function(subscript, coord) {
        var variables = _.clone(this.state.variables);
        variables["x_" + subscript] = coord[0];
        variables["y_" + subscript] = coord[1];
        this.setState({variables: variables});
    },

    _updateLineLocation: function(options, startCoord) {
        var xDiff = this._eval("(" + options.endX +
            ")-(" + options.startX + ")");
        var yDiff = this._eval("(" + options.endY +
            ")-(" + options.startY + ")");
        var endCoord = [startCoord[0] + xDiff, startCoord[1] + yDiff];
        var variables = _.clone(this.state.variables);
        variables["x_" + options.startSubscript] = startCoord[0];
        variables["y_" + options.startSubscript] = startCoord[1];
        variables["x_" + options.endSubscript] = endCoord[0];
        variables["y_" + options.endSubscript] = endCoord[1];
        this.setState({variables: variables});
    },

    _eval: function(expression, variables) {
        var expr = KAS.parse(expression,
            {functions: this.state.functions}).expr;
        if (!expr) {
            return 0;
        }
        val = expr.eval(_.extend(this.state.variables, variables));
        return val || 0;
    },

    // Return an array of all the variables in an expression
    _extractVars: function(expr) {
        if (expr == null) {
            return [];
        }
        var vars = [];
        _.each(expr.args(), function(arg) {
            if (arg && arg.constructor.name === "Expr") {
                vars = vars.concat(this._extractVars(arg));
            }
        }, this);

        if (expr.name() === "Var") {
            vars.push(expr.prettyPrint());
        }
        return vars;
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
                        coord={[this._eval(element.options.coordX,
                            this.state.variables),
                            this._eval(element.options.coordY,
                            this.state.variables)]}
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
                            strokeDasharray: element.options.strokeDasharray,
                            arrows: element.options.arrows
                        }} />;
                } else if (element.type === "movable-point") {
                    var constraints = [(coord) => {
                        var coordX =
                            Math.max(this._eval(element.options.constraintXMin),
                            Math.min(this._eval(element.options.constraintXMax),
                            coord[0]));
                        var coordY =
                            Math.max(this._eval(element.options.constraintYMin),
                            Math.min(this._eval(element.options.constraintYMax),
                            coord[1]));
                        return [coordX, coordY];
                    }];
                    if (element.options.constraint === "snap") {
                        constraints.push(MovablePoint.constraints.snap(
                            element.options.snap));
                    } else if (element.options.constraint === "x") {
                        constraints.push((coord) => {
                            return [this._eval(
                                element.options.constraintFn,
                                {y: coord[1]}), coord[1]];
                        });
                    } else if (element.options.constraint === "y") {
                        constraints.push((coord) => {
                            return [coord[0], this._eval(
                                element.options.constraintFn, {x: coord[0]})];
                        });
                    }

                    // TODO(eater): foo_[xyz] are hacky non-props to get the
                    // component to update when constraints change
                    return <MovablePoint
                        key={element.key}
                        coord={[
                            this.state.variables["x_" +
                            element.options.varSubscript],
                            this.state.variables["y_" +
                            element.options.varSubscript]]}
                        constraints={constraints}
                        foo_x={element.options.constraint}
                        foo_y={element.options.constraintFn}
                        foo_z={element.options.snap}
                        onMove={_.bind(this._updatePointLocation, this,
                            element.options.varSubscript)}
                        />;
                } else if (element.type === "movable-line") {
                    var constraints = [(coord) => {
                        var coordX =
                            Math.max(this._eval(element.options.constraintXMin),
                            Math.min(this._eval(element.options.constraintXMax),
                            coord[0]));
                        var coordY =
                            Math.max(this._eval(element.options.constraintYMin),
                            Math.min(this._eval(element.options.constraintYMax),
                            coord[1]));
                        return [coordX, coordY];
                    }];
                    if (element.options.constraint === "snap") {
                        constraints.push(MovablePoint.constraints.snap(
                            element.options.snap));
                    } else if (element.options.constraint === "x") {
                        constraints.push((coord) => {
                            return [this._eval(
                                element.options.constraintFn,
                                {y: coord[1]}), coord[1]];
                        });
                    } else if (element.options.constraint === "y") {
                        constraints.push((coord) => {
                            return [coord[0], this._eval(
                                element.options.constraintFn,
                                {x: coord[0]})];
                        });
                    }
                    return <MovableLine
                        key={element.key}
                        coords={[[
                            this.state.variables["x_" +
                                element.options.startSubscript],
                            this.state.variables["y_" +
                                element.options.startSubscript]
                            ],[
                            this.state.variables["x_" +
                                element.options.endSubscript],
                            this.state.variables["y_" +
                                element.options.endSubscript]]]}
                        constraints={constraints}
                        foo_x={element.options.constraint}
                        foo_y={element.options.constraintFn}
                        foo_z={element.options.snap}
                        onMove={_.bind(this._updateLineLocation, this,
                            element.options)}
                        />;
                } else if (element.type === "function") {
                    var fn = (x) => {
                        return this._eval(element.options.value, {x: x});
                    };
                    // find all the variables referenced by this function
                    var vars = _.without(this._extractVars(
                        KAS.parse(element.options.value).expr), "x");
                    // and find their values, so we redraw if any change
                    var varValues = _.object(vars,
                        _.map(vars, (v) => this.state.variables[v]));

                    var range=[this._eval(element.options.rangeMin,
                        this.state.variables),
                        this._eval(element.options.rangeMax,
                        this.state.variables)];

                    return <Plot
                        fn={fn}
                        foo_fn={element.options.value}
                        foo_varvalues={varValues}
                        range={range}
                        style={{
                            stroke: element.options.color,
                            strokeWidth: element.options.strokeWidth,
                            strokeDasharray: element.options.strokeDasharray,
                            plotPoints: 100  // TODO(eater): why so slow?
                        }} />;
                } else if (element.type === "parametric") {
                    var fn = (t) => {
                        return [
                            this._eval(element.options.x, {t: t}),
                            this._eval(element.options.y, {t: t})];
                    };
                    // find all the variables referenced by this function
                    var vars = _.without(this._extractVars(
                        KAS.parse(element.options.x).expr).concat(
                        this._extractVars(
                        KAS.parse(element.options.y).expr)), "t");
                    // and find their values, so we redraw if any change
                    var varValues = _.object(vars,
                        _.map(vars, (v) => this.state.variables[v]));

                    var range = [this._eval(element.options.rangeMin,
                        this.state.variables),
                        this._eval(element.options.rangeMax,
                        this.state.variables)];

                    return <PlotParametric
                        fn={fn}
                        foo_fnx={element.options.x}
                        foo_fny={element.options.y}
                        foo_varvalues={varValues}
                        range={range}
                        style={{
                            stroke: element.options.color,
                            strokeWidth: element.options.strokeWidth,
                            strokeDasharray: element.options.strokeDasharray,
                            plotPoints: 100  // TODO(eater): why so slow?
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
            arrows: "",
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
                &nbsp; &nbsp;
                <ArrowPicker
                    value={this.props.arrows}
                    onChange={this.change("arrows")} />
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


//
// Editor for interactive movable points
//
// TODO(eater): Factor this out maybe?
//
var MovablePointEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
    },

    getDefaultProps: function() {
        return {
            startX: "0",
            startY: "0",
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
                Update <TeX>(x_n, y_n)</TeX> for <TeX>n =</TeX> <NumberInput
                    value={this.props.varSubscript}
                    placeholder={0}
                    onChange={this.change("varSubscript")}/>
            </div>
            {this.transferPropsTo(<ConstraintEditor />)}
        </div>;
    }
});


//
// Editor for interactive movable line segments
//
// TODO(eater): Factor this out maybe?
//
var MovableLineEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
    },

    getDefaultProps: function() {
        return {
            startX: "-5",
            startY: "5",
            endX: "5",
            endY: "5",
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
        return <div className="graph-settings">
            Initial position:
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
                Start updates <TeX>(x_n, y_n)</TeX> for <TeX>n =</TeX>
                    <NumberInput
                        value={this.props.startSubscript}
                        placeholder={0}
                        onChange={this.change("startSubscript")}/>
            </div>
            <div className="perseus-widget-row">
                End updates <TeX>(x_m, y_m)</TeX> for <TeX>m =</TeX>
                    <NumberInput
                        value={this.props.endSubscript}
                        placeholder={0}
                        onChange={this.change("endSubscript")}/>
            </div>
            <div className="perseus-widget-row">
                All constraints are applied to the start point.
            </div>
            {this.transferPropsTo(<ConstraintEditor />)}
        </div>;
    }
});


//
// Editor for function plots
//
// TODO(eater): Factor this out maybe?
//
var FunctionEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
    },

    getDefaultProps: function() {
        return {
            value: "x",
            rangeMin: "-10",
            rangeMax: "10",
            color: KhanUtil.BLUE,
            strokeDasharray: "",
            strokeWidth: 2
        };
    },

    render: function() {
        return <div className="graph-settings">
            <div className="perseus-widget-row">
                <TeX>{this.props.funcName + "(x)="}</TeX> <ExpressionEditor
                    value={this.props.value}
                    onChange={this.change("value")} />
            </div>
            <div className="perseus-widget-row">
                Range: <TeX>\Large(</TeX><ExpressionEditor
                    value={this.props.rangeMin}
                    onChange={this.change("rangeMin")} />
                <TeX>,</TeX> <ExpressionEditor
                    value={this.props.rangeMax}
                    onChange={this.change("rangeMax")} />
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


//
// Editor for parametric plots
//
// TODO(eater): Factor this out maybe?
//
var ParametricEditor = React.createClass({
    mixins: [JsonifyProps, Changeable],

    propTypes: {
    },

    getDefaultProps: function() {
        return {
            x: "cos(t)",
            y: "sin(t)",
            rangeMin: "0",
            rangeMax: "2\\pi",
            color: KhanUtil.BLUE,
            strokeDasharray: "",
            strokeWidth: 2
        };
    },

    render: function() {
        return <div className="graph-settings">
            <div className="perseus-widget-row">
                <TeX>X(t) =</TeX> <ExpressionEditor
                    value={this.props.x}
                    onChange={this.change("x")} />
            </div>
            <div className="perseus-widget-row">
                <TeX>Y(t) =</TeX> <ExpressionEditor
                    value={this.props.y}
                    onChange={this.change("y")} />
            </div>
            <div className="perseus-widget-row">
                Range: <TeX>\Large(</TeX><ExpressionEditor
                    value={this.props.rangeMin}
                    onChange={this.change("rangeMin")} />
                <TeX>,</TeX> <ExpressionEditor
                    value={this.props.rangeMax}
                    onChange={this.change("rangeMax")} />
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

    getInitialState: function() {
        return {
            usedVarSubscripts: this._getAllVarSubscripts(this.props.elements),
            usedFunctionNames: this._getAllFunctionNames(this.props.elements)
        };
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({
            usedVarSubscripts: this._getAllVarSubscripts(nextProps.elements),
            usedFunctionNames: this._getAllFunctionNames(nextProps.elements)
        });
    },

    _getAllVarSubscripts: function(elements) {
        return _.map(_.where(elements, {type: "movable-point"}),
            (element) => element.options.varSubscript).concat(
            _.map(_.where(elements, {type: "movable-line"}),
            (element) => element.options.startSubscript)).concat(
            _.map(_.where(elements, {type: "movable-line"}),
            (element) => element.options.endSubscript));
    },

    _getAllFunctionNames: function(elements) {
        return _.map(_.where(elements, {type: "function"}),
            (element) => element.options.funcName);
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
            // Is there a better way to generate the key? This uses a random
            // hex string since _.uniqueId() is only unique per session.
            key: elementType + "-" + (Math.random()*0xffffff<<0).toString(16),
            options: elementType === "point" ?
                        PointEditor.originalSpec.getDefaultProps() :
                        elementType === "line" ?
                        LineEditor.originalSpec.getDefaultProps() :
                        elementType === "movable-point" ?
                        MovablePointEditor.originalSpec.getDefaultProps() :
                        elementType === "movable-line" ?
                        MovableLineEditor.originalSpec.getDefaultProps() :
                        elementType === "function" ?
                        FunctionEditor.originalSpec.getDefaultProps() :
                        elementType === "parametric" ?
                        ParametricEditor.originalSpec.getDefaultProps() : {}
        };
        if (elementType === "movable-point") {
            var nextSubscript =
                _.max([_.max(this.state.usedVarSubscripts), -1]) + 1;
            newElement.options.varSubscript = nextSubscript;
        } else if (elementType === "movable-line") {
            var nextSubscript =
                _.max([_.max(this.state.usedVarSubscripts), -1]) + 1;
            newElement.options.startSubscript = nextSubscript;
            newElement.options.endSubscript = nextSubscript + 1;
        } else if (elementType === "function") {
            // TODO(eater): The 22nd function added will be {(x) since '{'
            // comes after 'z'
            var nextLetter = String.fromCharCode(_.max([_.max(_.map(
                this.state.usedFunctionNames, function(c) {
                return c.charCodeAt(0); })),
                "e".charCodeAt(0)]) + 1);
            newElement.options.funcName = nextLetter;
        }
        this.change({
            elements: this.props.elements.concat(newElement)
        });
    },

    _deleteElement: function(key) {
        var element = _.findWhere(this.props.elements, {key: key});
        this.change({elements: _.without(this.props.elements, element)});
    },

    _moveElementUp: function(key) {
        var element = _.findWhere(this.props.elements, {key: key});
        var insertionPoint = _.indexOf(this.props.elements, element) - 1;
        var newElements = _.without(this.props.elements, element);
        newElements.splice(insertionPoint, 0, element);
        this.change({elements: newElements});
    },

    _moveElementDown: function(key) {
        var element = _.findWhere(this.props.elements, {key: key});
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
                if (element.type === "movable-point") {
                    return <ElementContainer
                            title={<span>Movable point <TeX>
                                    {"(x_{" + element.options.varSubscript +
                                    "}, y_{" + element.options.varSubscript +
                                    "})"}</TeX>
                                </span>}
                            onUp={n === 0 ? null : this._moveElementUp}
                            onDown={n === this.props.elements.length - 1 ?
                                null : this._moveElementDown}
                            onDelete={this._deleteElement}
                            key={element.key}>
                        <MovablePointEditor
                            startX={element.options.startX}
                            startY={element.options.startY}
                            constraint={element.options.constraint}
                            snap={element.options.snap}
                            constraintFn={element.options.constraintFn}
                            constraintXMin={element.options.constraintXMin}
                            constraintXMax={element.options.constraintXMax}
                            constraintYMin={element.options.constraintYMin}
                            constraintYMax={element.options.constraintYMax}
                            varSubscript={element.options.varSubscript}
                            onChange={(newProps) => {
                                var elements = JSON.parse(JSON.stringify(
                                    this.props.elements));
                                _.extend(elements[n].options, newProps);
                                this.change({elements: elements});
                            }} />
                    </ElementContainer>;
                } else if (element.type === "movable-line") {
                    return <ElementContainer
                            title={<span>Movable line <TeX>
                                    {"(x_{" + element.options.startSubscript +
                                    "}, y_{" + element.options.startSubscript +
                                    "})"}</TeX> to <TeX>
                                    {"(x_{" + element.options.endSubscript +
                                    "}, y_{" + element.options.endSubscript +
                                    "})"}</TeX>
                                </span>}
                            onUp={n === 0 ? null : this._moveElementUp}
                            onDown={n === this.props.elements.length - 1 ?
                                null : this._moveElementDown}
                            onDelete={this._deleteElement}
                            key={element.key}>
                        <MovableLineEditor
                            startX={element.options.startX}
                            startY={element.options.startY}
                            endX={element.options.endX}
                            endY={element.options.endY}
                            constraint={element.options.constraint}
                            snap={element.options.snap}
                            constraintFn={element.options.constraintFn}
                            constraintXMin={element.options.constraintXMin}
                            constraintXMax={element.options.constraintXMax}
                            constraintYMin={element.options.constraintYMin}
                            constraintYMax={element.options.constraintYMax}
                            startSubscript={element.options.startSubscript}
                            endSubscript={element.options.endSubscript}
                            onChange={(newProps) => {
                                var elements = JSON.parse(JSON.stringify(
                                    this.props.elements));
                                _.extend(elements[n].options, newProps);
                                this.change({elements: elements});
                            }} />
                    </ElementContainer>;
                } else if (element.type === "point") {
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
                            arrows={element.options.arrows}
                            strokeWidth={element.options.strokeWidth}
                            onChange={(newProps) => {
                                var elements = JSON.parse(JSON.stringify(
                                    this.props.elements));
                                _.extend(elements[n].options, newProps);
                                this.change({elements: elements});
                            }} />
                    </ElementContainer>;
                } else if (element.type === "function") {
                    return <ElementContainer
                            title={<span>Function <TeX>{
                                element.options.funcName + "(x) = " +
                                element.options.value
                            }</TeX></span>}
                            onUp={n === 0 ? null : this._moveElementUp}
                            onDown={n === this.props.elements.length - 1 ?
                                null : this._moveElementDown}
                            onDelete={this._deleteElement}
                            key={element.key}>
                        <FunctionEditor
                            value={element.options.value}
                            funcName={element.options.funcName}
                            rangeMin={element.options.rangeMin}
                            rangeMax={element.options.rangeMax}
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
                } else if (element.type === "parametric") {
                    return <ElementContainer
                            title={<span>Parametric</span>}
                            onUp={n === 0 ? null : this._moveElementUp}
                            onDown={n === this.props.elements.length - 1 ?
                                null : this._moveElementDown}
                            onDelete={this._deleteElement}
                            key={element.key}>
                        <ParametricEditor
                            x={element.options.x}
                            y={element.options.y}
                            rangeMin={element.options.rangeMin}
                            rangeMax={element.options.rangeMax}
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
                    <option value="function">Function plot</option>
                    <option value="parametric">Parametric plot</option>
                    <option value="movable-point">
                        &#x2605; Movable point</option>
                    <option value="movable-line">
                        &#x2605; Movable line segment</option>
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
