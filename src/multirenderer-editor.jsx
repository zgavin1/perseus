var React = require('react');
var _ = require("underscore");

var Editor = require("./editor.jsx");
var JsonEditor = require("./json-editor.jsx");
var MultiRenderer = require("./multirenderer.jsx");

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

    getInitialState: function() {
        return {
            developerMode: false,
        };
    },

    _toggleDeveloperMode: function() {
        this.setState({developerMode: !this.state.developerMode});
    },

    /**
     * Called by the JSON editor whenever the user makes changes.
     */
    _changeJSON: function(json) {
        this.props.onChange({
            questions: json.questions || null,
            context: json.context || null,
        });
    },

    render: function() {
        // We have two totally separate rendering methods for developer vs
        // normal mode because of how different they are from eachother.
        if (this.state.developerMode) {
            return this._renderDeveloper();
        } else {
            return this._renderNormal();
        }
    },

    /**
     * Renders the editor in developer json mode.
     */
    _renderDeveloper: function() {
        return <div>
            <label>
                <input type="checkbox"
                       checked
                       onChange={this._toggleDeveloperMode} />
                Developer JSON mode
            </label>
            <JsonEditor
                multiLine={true}
                value={_.pick(this.props, "questions", "context")}
                onChange={this._changeJSON} />
        </div>;
    },

    /**
     * Renders the editor in normal mode (not developer json mode)
     */
    _renderNormal: function() {
        return <div className="perseus-editor-table">
            <div className="perseus-editor-row">
                <div className="perseus-editor-left-cell">
                    <label>
                        <input type="checkbox"
                               onChange={this._toggleDeveloperMode} />
                        Developer JSON mode
                    </label>
                    {this.props.questions.map((item, i) => {
                        return [
                            <div className="pod-title">
                                Question #{i + 1}
                                <div className="question-button-container">
                                    <a href="javascript: void 0"
                                       className="simple-button orange"
                                            onClick={() => {
                                                this._handleRemoveQuestion(i);
                                            }}>
                                        <span className="icon-trash" />
                                    </a>
                                </div>
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
                    <a href="javascript: void 0"
                       className="simple-button orange"
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

    _handleRemoveQuestion: function(i) {
        var newQuestions = _.clone(this.props.questions);
        newQuestions.splice(i, 1);
        this.props.onChange({
            questions: newQuestions
        });
    },

    _handleAddQuestion: function() {
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

        var newQuestions = _.clone(this.props.questions);
        newQuestions.push(defaultQuestion);
        this.props.onChange({
            questions: newQuestions
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
