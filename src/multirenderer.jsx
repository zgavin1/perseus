var Renderer = require("./renderer.jsx");

var MultiRenderer = React.createClass({
    propTypes: {
        itemList: React.PropTypes.arrayOf(React.PropTypes.object),
        leftColumn: React.PropTypes.object,

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
        // To ensure that the widgets in the right column have access to the
        // left column through the _interWidgets method, we render the left
        // column first. When the component is mounted we set
        // leftColumnRendered to true allowing the right column widgets to be
        // renderered. This means that the right column widgets can use the
        // interWidgets communication channel to get information from the left
        // column.
        return {leftColumnRendered: false};
    },

    componentDidMount: function() {
        this.setState({leftColumnRendered: true});
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
        if (this.state.leftColumnRendered) {
            rendererList = _.flatten(_.map(this.props.itemList, (item, i) => {
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
                ref="leftColumn"
                content={this.props.leftColumn.question.content}
                images={this.props.leftColumn.question.images}
                widgets={this.props.leftColumn.question.widgets} />
            {rendererList}
        </div>;
    },

    _interWidgets: function(filterCriterion, localResults) {
        if (localResults.length) {
            return localResults;
        } else {
            return this.refs.leftColumn.interWidgets(filterCriterion);
        }
    },
});

module.exports = MultiRenderer;
