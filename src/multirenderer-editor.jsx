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
            serializedState: null,
            problemNum: 0,
            reviewMode: false,
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

    getSerializedState: function() {
        return this.refs.multirenderer.getSerializedState();
    },

    restoreSerializedState: function(state) {
        this.setState({
            serializedState: state,
            problemNum: this.state.problemNum + 1,
        });
    },

    serialize: function() {
        // If we have editors on screen, run serialize on them
        if (!this.state.developerMode) {
            return {
                context: this.refs.contextEditor.serialize(),
                questions: _.map(_.range(this.props.questions.length), (i) => {
                    return this.refs["editor" + i].serialize();
                }),
            };
        }

        return _.pick(this.props, "questions", "context");
    },

    setReviewMode: function(reviewMode) {
        this.setState({reviewMode: reviewMode});
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
        var questionEditors = this.props.questions.map((item, i) => {
            var buttonClassName =
                "simple-button orange question-control-button";

            var shiftDownButton = null;
            if (i + 1 < this.props.questions.length) {
                shiftDownButton = (
                    <a href="javascript: void 0"
                       className={buttonClassName}
                       onClick={() => {
                           this._handleShiftQuestion(i, 1);
                       }}>
                        <span className="icon-circle-arrow-down" />
                    </a>);
            }

            var shiftUpButton = null;
            if (i > 0) {
                shiftUpButton = (
                    <a href="javascript: void 0"
                       className={buttonClassName}
                       onClick={() => {
                           this._handleShiftQuestion(i, -1);
                       }}>
                        <span className="icon-circle-arrow-up" />
                    </a>);
            }

            return [
                <div className="pod-title">
                    Question #{i + 1}
                    <div className="question-button-container">
                        {shiftDownButton}
                        {shiftUpButton}
                        <a href="javascript: void 0"
                           className={buttonClassName}
                           onClick={() => {
                               this._handleRemoveQuestion(i);
                           }}>
                            <span className="icon-trash" />
                        </a>
                        <a href="javascript: void 0"
                           className={buttonClassName}
                           onClick={() => {
                               this._handleAddQuestion(i);
                           }}>
                            <span className="icon-plus" />
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
        });


        // We want to make srue users can create a question if there aren't any
        // yet.
        if (questionEditors.length === 0) {
            questionEditors = (
                <a href="javascript: void 0"
                   className="simple-button orange"
                   onClick={() => {
                       this._handleAddQuestion(0);
                   }}>
                    <span className="icon-plus" /> Create the first question
                </a>);
        }

        var editorClassName =
            "perseus-multirenderer-editor perseus-editor-table";
        return <div className={editorClassName}>
            <div className="perseus-editor-row">
                <div className="perseus-editor-left-cell">
                    <label>
                        <input type="checkbox"
                               onChange={this._toggleDeveloperMode} />
                        Developer JSON mode
                    </label>
                    <div className="pod-title">
                        Context
                    </div>
                    <Editor
                        {...this.props.context}
                        ref="contextEditor"
                        onChange={this._handleContextChange}
                        placeholder="Add context here..." />
                    {questionEditors}
                </div>
                <div className="perseus-editor-right-cell">
                    <MultiRenderer
                        ref="multirenderer"
                        questions={this.props.questions}
                        context={this.props.context}
                        problemNum={this.state.problemNum}
                        serializedState={this.state.serializedState}
                        questionNumbers={{
                                start: 1,
                                totalQuestions: this.props.questions.length
                        }}
                        questionOptions={
                            _.object(_.map(this.props.questions,
                                           (question, index) => {
                                return [
                                    index,
                                    {reviewMode: this.state.reviewMode}
                                ];
                            }))
                        } />
                </div>
            </div>
        </div>;
    },

    _handleRemoveQuestion: function(questionIndex) {
        var newQuestions = _.clone(this.props.questions);
        newQuestions.splice(questionIndex, 1);
        this.props.onChange({
            questions: newQuestions
        });
    },

    /**
     * Called whenever a content creator tries to change the position of a
     * question.
     *
     * delta will either be -1 if moving the question up, or 1 if moving the
     * question down.
     */
    _handleShiftQuestion: function(questionIndex, delta) {
        if (delta !== -1 && delta !== 1) {
            console.error("Illegal delta value");
            return;
        }

        var newQuestions = _.clone(this.props.questions);

        // Swap the question with either the question above or below it
        var temp = newQuestions[questionIndex];
        newQuestions[questionIndex] = newQuestions[questionIndex + delta];
        newQuestions[questionIndex + delta] = temp;

        this.props.onChange({
            questions: newQuestions,
        });
    },

    /**
     * Called whenever a user wants to add a new question.
     *
     * The question will be created immediately after the given question
     * index.
     */
    _handleAddQuestion: function(questionIndex) {
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
        newQuestions.splice(questionIndex + 1, 0, defaultQuestion);
        this.props.onChange({
            questions: newQuestions
        });
    },

    /**
     * Called whenever a question's props change.
     */
    _handleQuestionChange: function(questionIndex, newProps) {
        // Clone all the current questions
        var questions = _.clone(this.props.questions);

        // Modify the one question that was changed (we need to be careful to
        // not mutate any existing values, otherwise our renderer will have
        // trouble figuring out which of its props changed).
        questions[questionIndex] = _.extend({}, questions[questionIndex],
                                            newProps);

        // Tell our parent that we want our props to change.
        this.props.onChange({questions: questions});
    },

    /**
     * Called whenever the context's props change.
     */
    _handleContextChange: function(newProps) {
        // Update the context with the properties that changed
        context = _.extend({}, this.props.context, newProps);

        this.props.onChange({context: context});
    },
});

module.exports = MultiRendererEditor;
