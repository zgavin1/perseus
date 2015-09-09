var BlurInput = require("react-components/blur-input.jsx");
var Editor = require("../editor.jsx");
var InfoTip = require("react-components/info-tip.jsx");
var ReferenceCard = require("../components/reference-card.jsx");

var Reference = React.createClass({
    propTypes: {
        left: React.PropTypes.string,
        right: React.PropTypes.string,
    },

    getDefaultProps: function() {
        return {
            left: "",
            right: "",
        };
    },

    render: function() {
        return <ReferenceCard
                    left={this.props.left}
                    right={this.props.right}
                    showLink={false} />;
    },

    statics: {
        displayMode: "block"
    }
});


var ReferenceEditor = React.createClass({
    propTypes: {
        left: React.PropTypes.string,
        right: React.PropTypes.string,
        link: React.PropTypes.string,
    },

    getDefaultProps: function() {
        return {
            left: "",
            right: "",
            link: ""
        };
    },

    render: function() {
        return <div>
            <div>
                <Editor
                    content={this.props.left}
                    widgetEnabled={false}
                    onChange={_.partial(this._handleEditorChange, "left")} />
            </div>
            <div>
                <Editor
                    content={this.props.right}
                    widgetEnabled={false} 
                    onChange={_.partial(this._handleEditorChange, "right")} />
            </div>
            <div>
                {"Link: "}
                <BlurInput
                    value={this.props.link}
                    onChange={this._handleLinkChange} />
                <InfoTip>
                    <p>If left blank, will default to this article.</p>
                </InfoTip>
            </div>
        </div>;
    },

    _handleEditorChange: function(prop, newJson) {
        if (_.has(newJson, "content")) {
            var props = {};
            props[prop] = newJson.content;
            this.props.onChange(props);
        }
    },

    _handleLinkChange: function(newLink) {
        this.props.onChange({link: newLink});
    },

    serialize: function() {
        return _.pick(this.props, "left", "right", "link");
    }
});


module.exports = {
    name: "reference",
    displayName: "Reference",
    widget: Reference,
    editor: ReferenceEditor
};
