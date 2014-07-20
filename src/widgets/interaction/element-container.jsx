/** @jsx React.DOM */

var ElementContainer = React.createClass({
    getDefaultProps: function() {
        return {
            show: false,
            title: "More",
            onUp: null,
            onDown: null,
            onDelete: null
        };
    },

    render: function() {
        return <div className="perseus-interaction-element">
            <a href="#" className={"perseus-interaction-element-title " +
                (this.props.show ? "open" : "closed")}
                onClick={this.toggle}>
                <i className={"icon-chevron-" +
                    (this.props.show ? "down" : "right")} />
                {this.props.title}
            </a>
            <div className={"perseus-interaction-element-content " +
                    (this.props.show ? "enter" : "leave")}>
                {this.props.children}
                {(this.props.onUp != null ||
                    this.props.onDown != null ||
                    this.props.onDelete != null) &&
                    <div className={"edit-controls"}>
                        {(this.props.onUp != null) && <button
                            onClick={() => this.props.onUp(this.props.key)}>
                                <i className={"icon-circle-arrow-up"} />
                            </button>}
                        {(this.props.onDown != null) && <button
                            onClick={() => this.props.onDown(this.props.key)}>
                                <i className={"icon-circle-arrow-down"} />
                            </button>}
                        {(this.props.onDelete != null) && <button
                            onClick={() => this.props.onDelete(
                                    this.props.key)}>
                                <i className={"icon-trash"} />
                            </button>}
                    </div>
                }
            </div>
        </div>;
    },

    toggle: function(e) {
        e.preventDefault();
        this.props.onToggle(!this.props.show);
    }
});

module.exports = ElementContainer;
