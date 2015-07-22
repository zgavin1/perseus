var Renderer = require("./renderer.jsx");

var MultiRenderer = React.createClass({
    propTypes: {
       itemList: React.PropTypes.arrayOf(React.PropTypes.object)
    },

    render: function() {
        var rendererList = _.map(this.props.itemList, function(item) {
            return (
                <Renderer
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
