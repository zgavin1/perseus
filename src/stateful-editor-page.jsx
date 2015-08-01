var React = require('react');
var _ = require("underscore");

var EditorPage = require("./editor-page.jsx");
var store = require("./editor/store.jsx");

/* Renders an EditorPage (or an ArticleEditor) as a non-controlled component.
 *
 * Normally the parent of EditorPage must pass it an onChange callback and then
 * respond to any changes by modifying the EditorPage props to reflect those
 * changes. With StatefulEditorPage changes are stored in state so you can
 * query them with serialize.
 */
var StatefulEditorPage = React.createClass({

    propTypes: {
        componentClass: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            componentClass: EditorPage
        };
    },

    render: function() {
        var editorProps = _.clone(this.props.editorComponentProps);
        editorProps.onChange = this.handleChange;
        editorProps.ref = "editor";
        editorProps.json = this.state.appData.get("json").toJS();
        return <this.props.componentClass {...editorProps} />;
    },

    getInitialState: function() {
        return {
            appData: store(null, {
                type: "initWithJson",
                json: this.props.json
            })
        };
    },

    // TODO(kevindangoor) Save warnings should probably be a model layer
    // thing to check the data.
    getSaveWarnings: function() {
        return this.refs.editor.getSaveWarnings();
    },

    serialize: function() {
        return this.state.appData.get("json").toJS();
    },

    handleChange: function(newState, cb) {
        if (this.isMounted()) {
            this.setState({
                appData: store(this.state.appData, {
                    type: "change",
                    newState: newState
                })
            }, cb);
        }
    },

    scorePreview: function() {
        return this.refs.editor.scorePreview();
    }
});

module.exports = StatefulEditorPage;
