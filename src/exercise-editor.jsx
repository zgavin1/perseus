const _ = require("underscore");

const Sidebar = require("./edit-exercise/sidebar.jsx");
const ItemArea = require("./edit-exercise/item-area.jsx");

const STYLES = {
    container: {
        display: "flex",
        flexDirection: "row",
    },
    sidebar: {
        flexGrow: 0,
    },
    itemArea: {
        flexGrow: 1,
    },
    header: {

    },
    github: {
        float: "right",
    },
    page: {

    },
};

GITHUB_LINK = "https://github.com/khan/perseus";

const ExerciseEditor = React.createClass({
    getInitialState: function() {
        return {
            exercise: {
                name: "Perseus Exercise",
                items: [
                    {
                        name: "Item 1",
                        itemData: {},
                    },
                ],
            },
            currentItemIndex: 0,
        };
    },

    componentWillMount: function() {
        this._loadFromStorage();
    },

    render: function() {
        const exercise = this.state.exercise;
        const currentItemIndex = this.state.currentItemIndex;

        const itemNames = _.pluck(exercise.items, "name");
        const currentItem = exercise.items[currentItemIndex];
        const currentItemData = currentItem.itemData;

        return <div style={STYLES.page}>
            <div style={STYLES.header}>
                Perseus Demo Exercise
                <a style={STYLES.github} href={GITHUB_LINK}>
                    Code on GitHub!
                </a>
            </div>
            <div style={STYLES.container}>
                <Sidebar
                    style={STYLES.sidebar}
                    exerciseName={exercise.name}
                    items={itemNames}
                    currentIndex={currentItemIndex}
                    onReorder={this._handleReorder}
                    addItem={this._handleAddItem}
                    onItemSwitch={this._handleItemSwitch}
                    onSave={this._handleSave} />
                {exercise.items.length &&
                    <ItemArea
                        style={STYLES.itemArea}
                        item={currentItemData}
                        onChangeItem={this._handleItemChange} />
                }
            </div>
        </div>;
    },

    _handleItemChange: function(newItem) {
        const exercise = this.state.exercise;
        const currentItemIndex = this.state.currentItemIndex;
        
        const newExercise = _.extend({}, exercise, {
            items: _.map(exercise.items, (item, index) => {
                if (index === currentItemIndex) {
                    return {
                        name: item.name,
                        itemData: newItem,
                    };
                } else {
                    return item;
                }
            })
        });

        this.setState({
            exercise: newExercise
        });
    },

    _handleItemSwitch: function(newIndex) {
        this.setState({
            currentItemIndex: newIndex,
        });
    },

    _handleReorder: function(newOrderList) {
        const exercise = this.state.exercise;
        const oldItems = exercise.items;
        const newItems = _.map(newOrderList, (oldIndex) => {
            return oldItems[oldIndex];
        });
        const newExercise = _.extend({}, exercise, {
            items: newItems,
        });
        this.setState({
            exercise: newExercise,
        });
    },

    _handleAddItem: function() {
        const exercise = this.state.exercise;
        const newExercise = _.extend({}, exercise, {
            items: exercise.items.concat([{
                name: "Item " + (exercise.items.length + 1),
                itemData: {},
            }]),
        });
        this.setState({
            exercise: newExercise,
        });
    },

    _handleSave: function() {
        if (window.localStorage) {
            const exercise = this.state.exercise;
            localStorage.setItem(
                "perseus-demo-exercise",
                JSON.stringify(this.state.exercise)
            );
        } else {
            alert("No localstorage detected!\nCannot save :(");
        }
    },

    _loadFromStorage: function() {
        if (window.localStorage) {
            try {
                const exercise = JSON.parse(
                    window.localStorage.getItem("perseus-demo-exercise")
                );
                if (exercise != null) {
                    this.setState({
                        exercise: exercise,
                    });
                }
            } catch (e) {
                console.log("could not load exercise from localstorage");
            }
        }
    },
});

module.exports = ExerciseEditor;
