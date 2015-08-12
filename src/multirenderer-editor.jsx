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
        questions: React.PropTypes.arrayOf(rendererProps),
        context: React.PropTypes.object,
        onChange: React.PropTypes.func.isRequired,
    },

    render: function() {
        return <div className="perseus-editor-table">
            <div className="perseus-editor-row">
                <div className="perseus-editor-left-cell">
                    {this.props.questions.map((item, i) => {
                        return [
                            <div className="pod-title">
                                Question #{i + 1}
                            </div>,
                            <Editor
                                {...item}
                                ref={"editor" + i}
                                onChange={
                                    _.partial(this._handleQuestionChange, i)
                                }
                                placeholder="Add question here..." />
                        ];
                    })}
                </div>
                <div className="perseus-editor-right-cell">
                    <MultiRenderer
                        questions={this.props.questions}
                        context={this.props.context}
                        questionNumbers={{
                                start: 1,
                                totalQuestions: this.props.questions.length
                        }} />
                </div>
            </div>
            <div className="perseus-editor-row">
                <div className="perseus-editor-left-cell">
                    <a href="#" className="simple-button orange"
                            onClick={() => {
                                this._handleAddQuestion();
                            }}>
                        <span className="icon-plus" /> Add a question
                    </a>
                </div>
                <div className="perseus-editor-right-cell" />
            </div>
        </div>;
    },

    _handleAddQuestion() {
        var defaultQuestion = {
            "question": {
                "content": "",
                "images": {},
                "widgets": {}
            },
            "answerArea": {
                "type": "multiple",
                "options": {
                    "content": "",
                    "images": {},
                    "widgets": {}
                },
                "calculator": false,
                "periodicTable": false
            },
            "itemDataVersion": {
                "major": 0,
                "minor": 1
            },
            "hints": []
        };

        this.props.questions.push(defaultQuestion);
        this.props.onChange({
            questions: this.props.questions
        });
    },

    /**
     * Called whenever a question's props change.
     *
     * TODO(johnsullivan/phillip): Add a handler for the context's editor once
     *     we make an editor fo rit.
     */
    _handleQuestionChange: function(questionIndex, newProps) {
        // Clone all the current questions
        // TODO(johnsullivan/phillip): Not sure if this giant clone is
        //     necessary. The article renderer does it so we're doing it too!
        var questions = _.clone(this.props.questions);

        // Modify the one question that was changed (we need to be careful to
        // not mutate any existing values, otherwise our renderer will have
        // trouble figuring out which of its props changed).
        questions[questionIndex] = _.extend({}, questions[questionIndex],
                                            newProps);

        // Tell our parent that we want our props to change.
        this.props.onChange({questions: questions});
    },
});

module.exports = MultiRendererEditor;
