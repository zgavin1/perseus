var ApiOptions = require("../perseus-api.jsx").Options;
var SectionControlButton = require("../components/section-control-button.jsx");

var FloatingWidgetEditor = React.createClass({
    displayName: "FloatingWidgetEditor",

    propTypes: {
        apiOptions: ApiOptions.propTypes,
        widgetInfo: React.PropTypes.object.isRequired,
        id: React.PropTypes.string.isRequired,
        onChange: React.PropTypes.func.isRequired,
        onToggleEditor: React.PropTypes.func.isRequired,
    },

    render: function() {
        return <div>
            <SectionControlButton
                icon="icon-edit"
                onClick={this._toggleEditor} />
            <SectionControlButton
                icon="icon-trash"
                onClick={this._handleWidgetRemove} />
        </div>;
    },

    _toggleEditor: function(e) {
        if (this.props.onToggleEditor) {
            this.props.onToggleEditor(this.props.id, this.props.widgetInfo,
                e.clientY, e.clientX);
        }
    },

    _handleWidgetRemove: function() {
        console.log("TODO: Delete widget.");
    },
});

module.exports = FloatingWidgetEditor;
