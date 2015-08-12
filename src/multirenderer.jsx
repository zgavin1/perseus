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
        if (!this.state.isContextRendered) {
            this.setState({isContextRendered: true});
        }
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
                        key={this.state.keys.questions[i] + "-question"}
                        interWidgets={this._interWidgets}
                        content={item.content}
                        images={item.images}
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

    _interWidgets: function(filterCriterion, localResults) {
        if (localResults.length) {
            return localResults;
        } else {
            return this.refs.context.interWidgets(filterCriterion);
        }
    },
});

module.exports = MultiRenderer;
