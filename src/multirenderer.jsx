var Renderer = require("./renderer.jsx");

var MultiRenderer = React.createClass({
    propTypes: {
       itemList: React.PropTypes.arrayOf(React.PropTypes.object),
       leftColumn: React.PropTypes.object
    },

    getInitialState: function() {
        // To ensure that the widgets in the right column have access to the
        // left column through the _interWidgets method, we render the left
        // column first. When the component is mounted we set leftColumnRendered
        // to true allowing the right column widgets to be renderered. This
        // means that the right column widgets can use the interWidgets
        // communication channel to get information from the left column.
        return {leftColumnRendered: false};
    },

    componentDidMount: function() {
        this.setState({leftColumnRendered: true});
    },

    render: function() {
        var rendererList = null;

        // We render in two passes, see comment in getInitialState for more
        // information.
        if (this.state.leftColumnRendered) {
            rendererList = _.map(this.props.itemList, (item, i) => {
                // TODO (phillip): Think of a better key for the Renderer
                return (
                    <Renderer
                        key={i}
                        interWidgets={this._interWidgets}
                        content={item.question.content}
                        images={item.question.images}
                        widgets={item.question.widgets} />);
            });
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
