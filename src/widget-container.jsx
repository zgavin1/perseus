var classNames = require("classnames");
var React = require('react');

var EnabledFeatures = require("./enabled-features.jsx");
var Widgets = require("./widgets.js");

var WidgetContainer = React.createClass({
    propTypes: {
        apiOptions: React.PropTypes.object,
        shouldHighlight: React.PropTypes.bool.isRequired,
        type: React.PropTypes.string,
        enabledFeatures: EnabledFeatures.propTypes,
        initialProps: React.PropTypes.object.isRequired,

        widgetInfo: React.PropTypes.object,
        id: React.PropTypes.string,
        getWidgetDecorator: React.PropTypes.func,
    },

    getInitialState: function() {
        return {widgetProps: this.props.initialProps};
    },

    render: function() {
        var className = classNames({
            "perseus-widget-container": true,
            "widget-highlight": this.props.shouldHighlight,
            "widget-nohighlight": !this.props.shouldHighlight,
        });

        var type = this.props.type;
        var WidgetType = Widgets.getWidget(type, this.props.enabledFeatures);
        if (WidgetType == null) {
            // Just give up on invalid widget types
            return <div className={className} />;
        }

        var alignment = this.state.widgetProps.alignment;


        if (alignment === "default") {
            alignment = Widgets.getDefaultAlignment(type,
                            this.props.enabledFeatures);
        }

        className += " widget-" + alignment;

        var getWidgetDecorator = this.props.getWidgetDecorator;

        var widgetProps = this.props.renderProps || this.state.widgetProps;

        var widgetDecorator = getWidgetDecorator &&
            getWidgetDecorator(this.props.id, this.props.widgetInfo,
                widgetProps);

        return <div contentEditable={false}>
            {widgetDecorator}
            <WidgetType {...widgetProps} ref="widget" />
        </div>;
    },

    componentWillReceiveProps: function(nextProps) {
        if (this.props.type !== nextProps.type) {
            throw new Error(
                "WidgetContainer can't change widget type; set a different " +
                "key instead to recreate the container."
            );
        }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        return (
            this.props.shouldHighlight !== nextProps.shouldHighlight ||
            this.props.type !== nextProps.type ||
            this.state.widgetProps !== nextState.widgetProps ||
            this.props.renderProps !== nextProps.renderProps
        );
    },

    getWidget: function() {
        return this.refs.widget;
    },

    replaceWidgetProps: function(newWidgetProps) {
        this.setState({widgetProps: newWidgetProps});
    }
});

module.exports = WidgetContainer;
