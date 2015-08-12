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
        // NOTE: Use the _getQuestionOptions method rather than reading from
        //     this prop directly.
        questionOptions: React.PropTypes.objectOf(React.PropTypes.shape({
            // The number of hints to show for this question
            hintsVisible: React.PropTypes.number,
        })),

        // Called whenever the scores object changes. Should be a function that
        // takes in a scores object like getScores() returned.
        onScoresChanged: React.PropTypes.func,
    },

    // Default values for each question's options.
    DEFAULT_QUESTION_OPTIONS: {
        hintsVisible: 0,
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
        // If the context or questions change, we just remount everything. We
        // could be a little smarter (to only remount the questions if the
        // context changes for example), but it doesn't seem necessary.
        if (!_.isEqual(this.props.context, nextProps.context) ||
                !_.isEqual(this.props.questions, nextProps.questions)) {
            this.setState({
                isContextRendered: false,
                keys: this._createKeys(),
            });
        }
    },

    componentDidMount: function() {
        this.setState({isContextRendered: true});
    },

    componentDidUpdate: function(prevProps, prevState) {
        // If we just finished a two-pass render or our questions changed...
        if ((!prevState.isContextRendered && this.state.isContextRendered) ||
                    !_.isEqual(prevProps.questions, this.props.questions)) {
            this._recalculateScores();
        }

        // If we just finished rendering and the context was not rendered
        // before, it is now.
        if (!this.state.isContextRendered) {
            this.setState({isContextRendered: true});
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
     * Recalculates scores for each question and stores it.
     *
     * This function handles calling the onScoresChanged callback.
     */
    _recalculateScores: function() {
        var newScores = null;

        // Try and get the scores if all the questions have been rendered
        if (_.all(_.range(this.props.questions.length),
                   (i) => this.refs[this._getQuestionRef(i)])) {
            newScores = _.map(
                    _.range(this.props.questions.length), (questionIndex) => {
                return this.refs[this._getQuestionRef(questionIndex)].score();
            });
        }

        if (!_.isEqual(newScores, this._scores)) {
            this._scores = newScores;

            if (this.props.onScoresChanged) {
                this.props.onScoresChanged(this._scores);
            }
        }

        return this._scores;
    },

    /**
     * Renders a question number (to be placed above a question).
     *
     * relativeQuestionNumber will be 0 for the first question we're rendering,
     * 1 for the second question, etc.
     */
    _renderQuestionNumber: function(relativeQuestionNumber) {
        if (!this.props.questionNumbers) {
            return null;
        }

        var num = this.props.questionNumbers.start + relativeQuestionNumber;
        var total = this.props.questionNumbers.totalQuestions;
        return <div key={`question-number-${relativeQuestionNumber}`}>
            Question {num} of {total}
        </div>;
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
        return this._recalculateScores();
    },

    render: function() {
        // We render in two passes, see comment in getInitialState for more
        // information.
        var rendererList = null;
        if (this.state.isContextRendered) {
            rendererList = _.map(this.props.questions, (item, i) => {
                // TODO(johnsullivan): Is keying the Renderer and HintsRenderer
                //     necessary here?
                return <div key={this.state.keys.questions[i] + "-container"}>
                    {this._renderQuestionNumber(i)}
                    <Renderer
                        ref={this._getQuestionRef(i)}
                        key={this.state.keys.questions[i] + "-question"}
                        interWidgets={this._interWidgets}
                        content={item.content}
                        images={item.images}
                        onInteractWithWidget={this._onInteractWithQuestion}
                        widgets={item.widgets} />
                    <HintsRenderer
                        key={this.state.keys.questions[i] + "-hints"}
                        hintsVisible={this._getQuestionOptions(i).hintsVisible}
                        hints={item.hints} />
                </div>;
            });
        }

        return <div className="perseus-multirenderer">
            <div className="col">
                <div className="col-content">
                    <Renderer
                        ref="context"
                        content={this.props.context.content}
                        images={this.props.context.images}
                        widgets={this.props.context.widgets} />
                </div>
            </div>

            <div className="col">
                <div className="col-content">
                    {rendererList}
                </div>
            </div>
        </div>;
    },

    _onInteractWithQuestion: function() {
        this._recalculateScores();
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
