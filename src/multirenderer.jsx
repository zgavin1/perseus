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
    },

    getInitialState: function() {
        return {
            // To ensure that each question's widgets have access to the
            // context's widgets through the inter widgets bus, we must
            // guarantee that the context is rendered first. We do this by
            // rendering the questions only after the context has been
            // rendered.
            isContextRendered: false,
        };
    },

    componentDidMount: function() {
        this.setState({isContextRendered: true});
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
            rendererList = _.flatten(_.map(this.props.questions, (item, i) => {
                // TODO (phillip): Think of a better key for the Renderer. This
                //    might get us into some weird situations when we get a new
                //    list of items (ideally we'd have React unmount everything
                //    previously there, and mount new stuff).
                // This two-list will be flattened by the outer call to
                // _.flatten.
                return [
                    this._renderQuestionNumber(i),
                    <Renderer
                        key={i}
                        interWidgets={this._interWidgets}
                        content={item.question.content}
                        images={item.question.images}
                        widgets={item.question.widgets} />,
                ];
            }), true);
        }

        return <div className="MultiRenderer">
            <Renderer
                ref="context"
                content={this.props.context.question.content}
                images={this.props.context.question.images}
                widgets={this.props.context.question.widgets} />
            {rendererList}
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
