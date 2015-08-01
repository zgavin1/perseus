const React = require("react");
const SortableArea = require("react-components/sortable.jsx");

const STYLES = {
    sidebar: {
        width: 250,
        height: "100%",
    },
    header: {
        backgroundColor: "#585858",
        border: "1px solid #ddd",
        padding: "18px 12px",
        height: 154,
        width: "100%",
        boxSizing: "border-box",
    },
    exerciseName: {
        color: "#fff",
    },
    addItem: {
        width: "100%",
        boxSizing: "border-box",
        height: 40,
        border: '1px solid #ddd',
        background: '#585858',
        color: "#fff",
        display: "flex",
        alignItems: "center",
    },
};

const SidebarItem = React.createClass({
    render: function() {
        var style = (this.props.highlight) ?
            SidebarItem.selectedStyle :
            SidebarItem.style;
        return <div
                style={style}
                onClick={this.props.onClick}>
            {this.props.name}
        </div>;
    },

    statics: {
        style: {
            width: "100%",
            boxSizing: "border-box",
            height: 40,
            border: '1px solid #ddd',
            background: '#eee',
            display: "flex",
            alignItems: "center",
        },
        selectedStyle: {
            width: "100%",
            boxSizing: "border-box",
            height: 40,
            border: '1px solid #ddd',
            background: '#fcfcfc',
            display: "flex",
            alignItems: "center",
            fontWeight: "bold",
        }
    },
});

const Sidebar = React.createClass({
    render: function() {
        const items = _.map(this.props.items, (itemName, index) => {
            return <SidebarItem
                name={itemName}
                id={index}
                highlight={index === this.props.currentIndex}
                draggable={true}
                key={index}
                onClick={() => {
                    this.props.onItemSwitch(index);
                }} />;
        });
        var style = _.extend({}, STYLES.sidebar, this.props.style);
        return <div style={style}>
            <div style={STYLES.header}>
                <h2 style={STYLES.exerciseName}>
                    {this.props.exerciseName}
                </h2>
                <button style={STYLES.saveButton} onClick={this.props.onSave}>
                    Save!
                </button>
            </div>
            <button style={STYLES.addItem} onClick={this.props.addItem}>
                Add item!
            </button>
            <SortableArea
                components={items}
                onReorder={this._handleReorder} />
        </div>;
    },

    _handleReorder: function(newItemList) {
        this.props.onReorder(
            _.map(newItemList, (component) => component.props.id)
        );
    },
});

module.exports = Sidebar;
