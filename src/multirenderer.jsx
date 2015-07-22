var Renderer = require("./renderer.jsx");

var MultiRenderer = React.createClass({
    propTypes: {
       itemList: React.PropTypes.arrayOf(React.PropTypes.object)
    },

    render: function() {
        var rendererList = _.map(this.props.itemList, function(item, i) {
            // TODO (phillip): Think of a better key for the Renderer
            return (
                <Renderer
                    key={i},
                    content={item.question.content}
                    images={item.question.images}
                    widgets={item.question.widgets} />);
        });

        return <div className="MultiRenderer">
            {rendererList}
        </div>;
    }
});

module.exports = MultiRenderer;
