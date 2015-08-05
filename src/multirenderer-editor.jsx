var React = require('react');
var _ = require("underscore");

var MultiRenderer = require("./multirenderer.jsx");
var Editor = require("./editor.jsx");

var rendererProps = React.PropTypes.shape({
    content: React.PropTypes.string,
    widgets: React.PropTypes.object,
    images: React.PropTypes.object,
});

var MultiRendererEditor = React.createClass({

    propTypes: {
        json: React.PropTypes.arrayOf(rendererProps),
        context: React.PropTypes.object,
        onChange: React.PropTypes.func.isRequired,
    },

    render: function() {
        return <div className="perseus-editor-table">
            <div className="perseus-editor-row">
                <div className="perseus-editor-left-cell">
                    {this.props.json.map((item, i) => {
                        return [
                            <div className="pod-title">
                                Question #{i + 1}
                            </div>,
                            <Editor
                                {...item.question}
                                ref={"editor" + i}
                                onChange={
                                    _.partial(this._handleEditorChange, i)
                                }
                                placeholder="Add question here..." />
                        ];
                    })}
                </div>
                <div className="perseus-editor-right-cell">
                    <MultiRenderer
                        questions={this.props.json}
                        context={this.props.context}
                        questionNumbers={
                            {start: 1, totalQuestions: this.props.json.length}
                        } />
                </div>
            </div>
        </div>;
    },

    // TODO(phillip) I copied this from article-editor.jsx without fully
    // understanding what is going on.
    _handleEditorChange: function(i, newProps) {
        var items = _.clone(this.props.json);
        items[i].question = _.extend({}, items[i].question, newProps);
        this.props.onChange({json: questions});
    },
});

module.exports = MultiRendererEditor;
