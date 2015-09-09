var Renderer = require('../renderer.jsx');

var ReferenceCard = React.createClass({
    propTypes: {
        left: React.PropTypes.string,
        right: React.PropTypes.string,
        link: React.PropTypes.string,
        showLink: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            left: '',
            right: '',
            link: '',
            showLink: false
        };
    },

    render: function() {
        return <div className='perseus-reference-card'>
            <div className='reference-card-pair'>
                <div className='reference-card-left'>
                    <Renderer content={this.props.left} />
                </div>
                <div className='reference-card-right'>
                    <Renderer content={this.props.right} />
                </div>
            </div>
            {this.props.showLink && <div className='reference-card-link'>
                <a href={link} target='_blank' >
                    Learn more
                </a>
            </div>}
        </div>;
    },
});

module.exports = ReferenceCard;
