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
        return <div id={"editor-button-" + this.props.id.replace(" ", "-")}>
            <SectionControlButton
                icon="icon-edit"
                onClick={this._toggleEditor} />
        </div>;
    },

    _toggleEditor: function(e) {
        if (this.props.onToggleEditor) {
        	var offset = $(e.currentTarget).offset();
            this.props.onToggleEditor(this.props.id, this.props.widgetInfo,
                offset.top - 10, offset.left);
        }
    },

    _handleWidgetRemove: function() {
        console.log("TODO: Delete widget.");
    },
});

module.exports = FloatingWidgetEditor;
