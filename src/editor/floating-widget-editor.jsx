var ApiOptions = require("../perseus-api.jsx").Options;
var SectionControlButton = require("../components/section-control-button.jsx");

var FloatingWidgetButtons = React.createClass({
    displayName: "FloatingWidgetButtons",

    propTypes: {
        onEditClicked: React.PropTypes.func.isRequired,
        onTrashClicked: React.PropTypes.func.isRequired,
    },

    render: function () {
        return <div>
            <SectionControlButton
                icon="icon-edit"
                onClick={this.props.onEditClicked} />
            <SectionControlButton
                icon="icon-trash"
                onClick={this.props.onTrashClicked} />
        </div>;
    },
});

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
            <FloatingWidgetButtons
                onEditClicked={this._toggleEditor}
                onTrashClicked={this._handleWidgetRemove} />
        </div>;
    },

    _toggleEditor: function(e) {
    	if (this.props.onToggleEditor) {
    		this.props.onToggleEditor(this.props.id, this.props.widgetInfo, e.clientY, e.clientX);
    	}
    },

    _handleWidgetRemove: function() {
        console.log("TODO: Delete widget.");
    },
});

module.exports = FloatingWidgetEditor;
