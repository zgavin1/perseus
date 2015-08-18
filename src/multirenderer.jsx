var classNames = require("classnames");

var HintsRenderer = require("./hints-renderer.jsx");
var Renderer = require("./renderer.jsx");

var MultiRenderer = React.createClass({
    propTypes: {
        // A list of item data. Each will be rendered in its own Perseus
        // Renderer and treated as an independent question. A question's
        // widgets cannot access any other question's widgets through the inter
        // widgets bus (but see the context prop below).
        questions: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,

        // A single item data. This item provides context that is shared
        // between all of the questions. It will be rendered in its own Perseus
        // Renderer. Each question's widgets can access the widgets in the
        // context through the inter widgets bus.
        context: React.PropTypes.object,

        // Some blob of serialized state given by getSerializedState. When the
        // MultiRenderer is mounted or the problemNum changes, the rendered
        // questions will be forced into this state.
        serializedState: React.PropTypes.array,

        // A unique ID for the current "problem". If you are displaying a
        // number of items sequentially, you should change this every time the
        // item changes so we can reset everything.
        problemNum: React.PropTypes.number,

        // An object that describes how to render question numbers. If falsey,
        // no question numbers will be rendered.
        questionNumbers: React.PropTypes.shape({
            // The number of the first question we'll display
            start: React.PropTypes.number.isRequired,

            // The "total number of questions". This number will appear at the
            // end of each question number (ex: "Question 2 of 7").
            totalQuestions: React.PropTypes.number.isRequired,
        }),

        // Mapping from question number to options. Note that the question
        // number here is unaffected by the value of the questionNumbers prop
        // (ie: the first question rendered is always considered to be question
        // 0).
        //
        // See this.DEFAULT_QUESTION_OPTIONS for the default values.
        //
        // NOTE: Use the _getQuestionOptions method rather than reading from
        //     this prop directly.
        questionOptions: React.PropTypes.objectOf(React.PropTypes.shape({
            // The number of hints to show for this question
            hintsVisible: React.PropTypes.number,

            // Enables/disables review mode for this question. When a renderer
            // is in review mode, the correct answer will be somehow shown to
            // the user as well as what they selected (if the widget supports
            // review mode), and there will be an "INCORRECT", "CORRECT", or
            // "UNANSWERED" flair added to the question number if it is being
            // displayed.
            reviewMode: React.PropTypes.bool,
        })),

        // Called whenever the scores object changes. Should be a function that
        // takes in a scores object like getScores() returned.
        onScoresChanged: React.PropTypes.func,
    },

    // Default values for each question's options.
    DEFAULT_QUESTION_OPTIONS: {
        hintsVisible: 0,
        reviewMode: false,
    },

    /**
     * Create a new set of keys for this.state.keys.
     *
     * This will generate unique keys for all of our children renderers, which
     * (when used) will cause all of our renderers to be unmounted and new ones
     * to be mounted.
     */
    _createKeys: function() {
        return {
            context: _.uniqueId("context-"),
            questions: _.map(this.props.questions,
                             () => _.uniqueId("question-")),
        };
    },

    /**
     * Always use this method, rather than accessing the questionOptions prop
     * directly.
     */
    _getQuestionOptions: function(questionNum) {
        if (!this.props.questionOptions) {
            return this.DEFAULT_QUESTION_OPTIONS;
        }

        return _.defaults(
            {},
            this.props.questionOptions[questionNum] || {},
            this.DEFAULT_QUESTION_OPTIONS);
    },

    getInitialState: function() {
        return {
            // To ensure that each question's widgets have access to the
            // context's widgets through the inter widgets bus, we must
            // guarantee that the context is rendered first. We do this by
            // rendering the questions only after the context has been
            // rendered.
            isContextRendered: false,

            // This is an object containing keys we'll give to our child
            // renderers. Using this, we can force React to remount the
            // renderers when our item data changes instead of reusing them.
            // NOTE(johnsullivan): If the Perseus Renderer deals with prop
            //     changes well, we don't have to do this. At this time, there
            //     seem to be subtle problems that come up.
            keys: this._createKeys(),
        };
    },

    componentWillReceiveProps: function(nextProps) {
        // If the context, questions, or problem change, we just remount
        // everything. We could be a little smarter (to only remount the
        // questions if the context changes for example), but it doesn't seem
        // necessary and may source errors.
        if (this.props.problemNum !== nextProps.problemNum ||
                !_.isEqual(this.props.context, nextProps.context) ||
                !_.isEqual(this.props.questions, nextProps.questions)) {
            this.setState({
                isContextRendered: false,
                keys: this._createKeys(),
            });
        }

        // If the problem changed, make note of it
        if (this.props.problemNum !== nextProps.problemNum) {
            this._renderingNewProblem = true;
        }
    },

    componentWillMount: function() {
        // This will be true while we're rendering a new "problem" (where two
        // items with different problemIds are considered different problems).
        // Once we've finished rendering the new problem, it'll be set to
        // false.
        this._renderingNewProblem = true;
    },

    componentDidMount: function() {
        this.setState({isContextRendered: true});
    },

    componentDidUpdate: function(prevProps, prevState) {
        // If we just finished rendering the context
        if (!this.state.isContextRendered) {
            this.setState({isContextRendered: true});
        }

        // If we just *finished* a two pass render (so everything is rendered)
        if (!prevState.isContextRendered && this.state.isContextRendered) {
            // If we just finished rendering a new problem and need to restore
            // serialized state.
            if (this._renderingNewProblem && this.props.serializedState) {
                // Make sure our copy of the scores is up to date after we've
                // restored the serialized state to all the questions. We do
                // this with a callback (rather than just recalculating the
                // scores right after we call restoreSerializedState) because
                // all the questions needs to render once more before they can
                // be scored.
                var recalculateScores = (
                        _.after(this.props.serializedState.length,
                                () => this._updateScores()));

                // Restore each question individually.
                _.each(this.props.serializedState, (state, index) => {
                    var questionRenderer =
                            this.refs[this._getQuestionRef(index)];
                    questionRenderer.restoreSerializedState(
                        state, recalculateScores);
                });
            } else {
                // If we're not waiting for a restoreSerializedState call, we
                // can just immediately recalculate the scores.
                this._updateScores();
            }

            this._renderingNewProblem = false;
        }
    },

    /**
     * Gets the ref name of the given question.
     *
     * You can use this function to access a particular question's renderer.
     * For example:
     *
     *     var renderer = this.refs[this._getQuestionRef(2)];
     *
     * renderer will have the third question's renderer component (assuming
     * it was rendered already).
     */
    _getQuestionRef: function(questionIndex) {
        return "question" + this.state.keys.questions[questionIndex];
    },

    /**
     * Returns an array of score objects.
     *
     * Each score object is a Perseus style score like Renderer.score() would
     * return. IE:
     *
     *     {
     *         type: "invalid"|"points",
     *         message: string,
     *         earned: undefined|number,
     *         total: undefined|number
     *     }
     */
    getScores: function() {
        // Try and get the scores if all the questions have been rendered
        if (_.all(_.range(this.props.questions.length),
                   (i) => this.refs[this._getQuestionRef(i)])) {
            return _.map(
                    _.range(this.props.questions.length), (questionIndex) => {
                return this.refs[this._getQuestionRef(questionIndex)].score();
            });
        }

        return null;
    },

    /**
     * Updates this.state.scores and calls the onScoresChanged callback.
     */
    _updateScores: function() {
        var newScores = this.getScores();

        if (!_.isEqual(newScores, this.state.scores)) {
            this.setState({scores: newScores});

            if (this.props.onScoresChanged) {
                this.props.onScoresChanged(newScores);
            }
        }
    },

    /**
     * Returns a review note that shows whether the question is correct.
     */
    _renderQuestionReviewNote: function(score) {
        if (!score || score.type === "invalid") {
            return <span
                    className="question-note question-note-not-answered">
                Not answered
            </span>;
        } else if (score.earned !== score.total) {
            return <span className="question-note question-note-incorrect">
                Incorrect
            </span>;
        } else if (score.earned === score.total) {
            return <span className="question-note question-note-correct">
                Correct
            </span>;
        } else {
            return null;
        }
    },

    /**
     * Renders a question number (to be placed above a question).
     *
     * questionIndex will be 0 for the first question we're rendering, 1 for
     * the second question, etc.
     */
    _renderQuestionNumber: function(questionIndex) {
        if (!this.props.questionNumbers) {
            return null;
        }

        var reviewNote = null;
        if (this._getQuestionOptions(questionIndex).reviewMode &&
                this.state.scores) {
            reviewNote = this._renderQuestionReviewNote(
                    this.state.scores[questionIndex]);
        }

        var num = this.props.questionNumbers.start + questionIndex;
        var total = this.props.questionNumbers.totalQuestions;

        if (reviewNote) {
            return <div key={`question-number-${questionIndex}`}>
                Question {num} of {total}: {reviewNote}
            </div>;
        }

        return <div key={`question-number-${questionIndex}`}>
            Question {num} of {total}
        </div>;
    },

    /*
     * Returns a blob of data that can be used to restore an item's state.
     *
     * See the serializedState prop for this data's usage.
     */
    getSerializedState: function() {
        // Ensure that all the questions have been rendered
        if (!_.all(_.range(this.props.questions.length),
                   (i) => this.refs[this._getQuestionRef(i)])) {
            return null;
        }

        // Create an array that contains all the questions' serialized state
        return _.map(_.range(this.props.questions.length), (i) => {
            var questionRenderer = this.refs[this._getQuestionRef(i)];
            return questionRenderer.getSerializedState();
        });
    },

    render: function() {
        // We render in two passes, see comment in getInitialState for more
        // information.
        var rendererList = null;
        if (this.state.isContextRendered) {
            rendererList = _.map(this.props.questions, (item, i) => {
                // TODO(johnsullivan): Is keying the Renderer and HintsRenderer
                //     necessary here?
                return <div key={this.state.keys.questions[i] + "-container"}
                            className="question-container">
                    {this._renderQuestionNumber(i)}
                    <Renderer
                        ref={this._getQuestionRef(i)}
                        key={this.state.keys.questions[i] + "-question"}
                        interWidgets={this._interWidgets}
                        content={item.content}
                        images={item.images}
                        onInteractWithWidget={this._onInteractWithQuestion}
                        problemNum={this.state.problemNum}
                        reviewMode={this._getQuestionOptions(i).reviewMode}
                        widgets={item.widgets} />
                    <HintsRenderer
                        key={this.state.keys.questions[i] + "-hints"}
                        hintsVisible={this._getQuestionOptions(i).hintsVisible}
                        hints={item.hints || []} />
                </div>;
            });
        }

        // Build the column that'll contain the context's renderer (or not if
        // we weren't given a context).
        var contextColumn = null;
        if (this.props.context) {
            contextColumn = <div className="col context-col">
                <div className="col-content">
                    <Renderer
                        ref="context"
                        content={this.props.context.content}
                        images={this.props.context.images}
                        widgets={this.props.context.widgets} />
                </div>
            </div>;
        }

        var classes = classNames({
            "perseus-multirenderer": true,
            "two-column": contextColumn !== null,
            "one-column": contextColumn === null
        });

        return <div className={classes}>
            {contextColumn}
            <div className="col">
                <div className="col-content">
                    {rendererList}
                </div>
            </div>
        </div>;
    },

    _onInteractWithQuestion: function() {
        this._updateScores();
    },

    _interWidgets: function(filterCriterion, localResults) {
        if (localResults.length) {
            return localResults;
        } else {
            return this.refs.context.interWidgets(filterCriterion);
        }
    },
});

module.exports = MultiRenderer;
