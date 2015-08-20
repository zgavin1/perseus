var React = require('react');
var _ = require("underscore");

var Editor = require("./editor.jsx");
var JsonEditor = require("./json-editor.jsx");
var MultiRenderer = require("./multirenderer.jsx");

var EDITOR_MODES = ["edit", "preview", "json"];

/**
 * Component that displays the mode dropdown.
 *
 * The mode dropdown is the selector at the top of the editor that lets you
 * switch between edit, preview, and dev-only JSON mode.
 */
var ModeDropdown = React.createClass({

    propTypes: {
        currentMode: React.PropTypes.oneOf(EDITOR_MODES),

        // A function that takes in a string signifying the mode (ex: "edit")
        onChange: React.PropTypes.func,
    },

    _handleSelectMode: function(event) {
        if (this.props.onChange) {
            this.props.onChange(event.target.value);
        }
    },

    render: function() {
        return <label>
            Mode:{" "}
            <select value={this.props.currentMode}
                    onChange={this._handleSelectMode}>
                <option value="edit">Edit</option>
                <option value="preview">Preview</option>
                <option value="json">Dev-only JSON</option>
            </select>
        </label>;
    },

});

var MultiRendererEditor = React.createClass({

    propTypes: {
        json: React.PropTypes.object,
        onChange: React.PropTypes.func.isRequired,

        // The mode we'll start in
        defaultMode: React.PropTypes.oneOf(EDITOR_MODES),
    },

    getInitialState: function() {
        return {
            mode: this.props.defaultMode || "edit",
            serializedState: null,
            problemNum: 0,
            reviewMode: false,
        };
    },

    _setMode: function(mode) {
        this.setState({mode: mode});
    },

    /**
     * Called by the JSON editor whenever the user makes changes.
     */
    _changeJSON: function(json) {
        this.props.onChange({json: json});
    },

    getSerializedState: function() {
        if (!this.refs.multirenderer) {
            return null;
        }

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
                questions: _.map(_.range(this.props.json.questions.length),
                                 (i) => {
                    return this.refs["editor" + i].serialize();
                }),
            };
        }

        return this.props.json;
    },

    setReviewMode: function(reviewMode) {
        this.setState({reviewMode: reviewMode});
    },

    render: function() {
        // We have two totally separate rendering methods for developer vs
        // normal mode because of how different they are from eachother.
        if (this.state.mode === "json") {
            return this._renderDeveloper();
        } else if (this.state.mode === "edit") {
            return this._renderNormal();
        } else if (this.state.mode === "preview") {
            return this._renderPreview();
        }
    },

    /**
     * Create the question options prop that we should send down to the
     * Multi-Renderer.
     */
    _generateQuestionOptions: function() {
        return _.object(_.map(this.props.json.questions, (question, index) => {
            return [index, {reviewMode: this.state.reviewMode}];
        }));
    },

    /**
     * Renders the editor in preview mode.
     */
    _renderPreview: function() {
        var questionNumbers = {
            start: 1,
            totalQuestions:
                // If we're rendering a simple item (which can only happen if
                // the content was URL encoded and we went straight to preview
                // mode) we'll force the totalQuestions to 1.
                this.props.json.questions ?
                    this.props.json.questions.length : 1,
        };

        return <div>
            <ModeDropdown currentMode="preview" onChange={this._setMode} />
            <MultiRenderer
                ref="multirenderer"
                json={this.props.json}
                problemNum={this.state.problemNum}
                serializedState={this.state.serializedState}
                questionNumbers={questionNumbers}
                questionOptions={this._generateQuestionOptions()}
                enableMoreQuestionsTag={true} />
        </div>;
    },

    /**
     * Renders the editor in developer json mode.
     */
    _renderDeveloper: function() {
        return <div>
            <ModeDropdown currentMode="json" onChange={this._setMode} />
            <JsonEditor
                multiLine={true}
                value={this.props.json}
                onChange={this._changeJSON} />
        </div>;
    },

    /**
     * Renders the editor in normal mode (not developer json mode)
     */
    _renderNormal: function() {
        var questionEditors = this.props.json.questions.map((item, i) => {
            var buttonClassName =
                "simple-button orange question-control-button";

            var shiftDownButton = null;
            if (i + 1 < this.props.json.questions.length) {
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
                    <ModeDropdown currentMode="edit"
                                  onChange={this._setMode} />
                    <div className="pod-title">
                        Context
                    </div>
                    <Editor
                        {...this.props.json.context}
                        ref="contextEditor"
                        onChange={this._handleContextChange}
                        placeholder="Add context here..." />
                    {questionEditors}
                </div>
                <div className="perseus-editor-right-cell">
                    <MultiRenderer
                        ref="multirenderer"
                        json={this.props.json}
                        problemNum={this.state.problemNum}
                        serializedState={this.state.serializedState}
                        questionNumbers={{
                                start: 1,
                                totalQuestions:
                                    this.props.json.questions.length,
                        }}
                        questionOptions={this._generateQuestionOptions()} />
                </div>
            </div>
        </div>;
    },

    _handleRemoveQuestion: function(questionIndex) {
        var json = _.clone(this.props.json);
        json.questions = _.clone(json.questions);

        json.questions.splice(questionIndex, 1);
        this.props.onChange({json: json});
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

        var json = _.clone(this.props.json);
        json.questions = _.clone(json.questions);

        // Swap the question with either the question above or below it
        var temp = json.questions[questionIndex];
        json.questions[questionIndex] = json.questions[questionIndex + delta];
        json.questions[questionIndex + delta] = temp;

        this.props.onChange({json: json});
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

        var json = _.clone(this.props.json);
        json.questions = _.clone(json.questions);
        json.questions.splice(questionIndex + 1, 0, defaultQuestion);

        this.props.onChange({json: json});
    },

    /**
     * Called whenever a question's props change.
     */
    _handleQuestionChange: function(questionIndex, newProps) {
        // Clone all the current questions
        var json = _.clone(this.props.json);

        // Modify the one question that was changed (we need to be careful to
        // not mutate any existing values, otherwise our renderer will have
        // trouble figuring out which of its props changed).
        json.questions[questionIndex] =
            _.extend({}, json.questions[questionIndex], newProps);

        // Tell our parent that we want our props to change.
        this.props.onChange({json: json});
    },

    /**
     * Called whenever the context's props change.
     */
    _handleContextChange: function(newProps) {
        var json = _.clone(this.props.json);
        json.context = _.extend({}, this.props.json.context, newProps);

        this.props.onChange({json: json});
    },
});

module.exports = MultiRendererEditor;
