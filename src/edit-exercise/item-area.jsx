var React = require("react");
var EditorPage = require("../editor-page.jsx");

var ItemArea = React.createClass({
    render: function() {
        return <div style={this.props.style}>
            <EditorPage
                {...this.props.item}
                onChange={this.props.onChangeItem}
                developerMode={true}
                ref="editorPage" />
        </div>;
    },

});

module.exports = ItemArea;

