/** @jsx React.DOM */
(function(Perseus) {

var Editor = Perseus.Editor;

var ItemEditor = Perseus.ItemEditor = React.createClass({
    defaultState: {
        question: {},
        answerArea: {},
        hints: [],
        timeline: null
    },

    getInitialState: function() {
        var self = this;
        self.item = self.props.item || new Perseus.ItemData(self.props);
        // self.item.onChange(_.bind(self.update, self));
        
        d3.json("times.json/", function (data) {
            self.setState({timeline: data});
        });
        var props = _.pick(self.props, _.keys(self.defaultState));
        return _.defaults(props, self.defaultState);
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState(_.pick(nextProps, _.keys(this.defaultState)));
    },

    componentDidUpdate: function(prevProps, prevState, rootNode) {
        if (!_.isEqual(prevState, this.state)) {
            this.updatePreview();
        }
    },

    componentWillMount: function() {
        //this.squashHints(this.state.smartHints);
        //this.orderSmartHints(this.state.smartHints);
        this.rendererMountNode = document.createElement("div");
    },

    componentDidMount: function() {
        this.renderer = React.renderComponent(Perseus.ItemRenderer({
            item: this.item,
            initialHintsVisible: -1  /* all */
        }), this.rendererMountNode);
        this.updatePreview();
    },

    render: function() {
        var timeline = this.state.timeline;
        return <div className="perseus-item-editor">
            {Editor(_.extend({
                ref: "questionEditor",
                className: "perseus-question-editor",
                onChange: function(newProps, cb) {
                    var question = _.extend({}, this.state.question, newProps);
                    this.setState({question: question}, cb);
                }.bind(this)
            }, this.state.question))}

            {Perseus.SmartHintEditor({
                item: this.item,
                changeCorrectAnswer: this.changeCorrectAnswer,
                addSmartHint: this.addSmartHint,
                showCorrect: this.showCorrect,
                showSmartHint: this.showSmartHint
            })}

            {timeline && Perseus.Timeline({data: timeline})}

            {AnswerAreaEditor(_.extend({
                ref: "answerAreaEditor",
                onChange: function(newProps, cb) {
                    var answerArea = _.extend({}, this.state.answerArea,
                            newProps);
                    this.setState({answerArea: answerArea}, cb);
                }.bind(this)
            }, this.state.answerArea))}

            {this.state.hints.map(function(hint, i) {
                return HintEditor(_.extend({
                    key: "hintEditor" + i,
                    ref: "hintEditor" + i,
                    onChange: function(newProps, cb) {
                        var hints = _.clone(this.state.hints);
                        hints[i] = _.extend({}, this.state.hints[i],
                                newProps);
                        this.setState({hints: hints}, cb);
                    }.bind(this),
                    onRemove: function() {
                        var hints = _.clone(this.state.hints);
                        hints.splice(i, 1);
                        this.setState({hints: hints});
                    }.bind(this)
                }, hint));
            }, this)}

            <div className="add-hint-container">
                <a href="#" className="simple-button orange"
                        onClick={this.addHint}>
                    <span className="icon-plus" />
                    Add a hint
                </a>
            </div>
        </div>;
    },

    addHint: function() {
        var hints = this.state.hints.concat([{}]);
        var i = hints.length - 1;

        this.setState({hints: hints}, function() {
            this.refs["hintEditor" + i].focus();
        }.bind(this));
        return false;
    },

    updatePreview: function() {
        this.item.setItemData(this.toJSON(true));
    },

    showCorrect: function () {
        this.renderer.showCorrect();
    },

    showSmartHint: function(id) {
        this.renderer.showSmartHint(id);
    },

    scorePreview: function() {
        if (this.renderer) {
            return this.renderer.scoreInput();
        } else {
            return null;
        }
    },

    changeCorrectAnswer: function() {
        var guess = this.renderer.getGuess();
        this.item.changeCorrectAnswer(guess);
    },

    addSmartHint: function(hint) {
        var guess = this.renderer.getGuess();
        this.item.addSmartHint(guess, hint);
    },
    
    toJSON: function(skipValidation) {
        return {
            question: this.refs.questionEditor.toJSON(skipValidation),
            answerArea: this.refs.answerAreaEditor.toJSON(skipValidation),
            hints: this.state.hints.map(function(hint, i) {
                return this.refs["hintEditor" + i].toJSON(skipValidation)
            }, this),
            correctAnswer: this.item.correctAnswer,
            smartHints: this.item.smartHints,
            lastSmartHintId: this.item.lastSmartHintId
        };
    },

    focus: function() {
        this.questionEditor.focus();
    }
});


var HintEditor = React.createClass({
    getDefaultProps: function() {
        return {
            content: ""
        };
    },

    render: function() {
        return <div className="perseus-hint-editor">
            <Editor ref="editor" content={this.props.content}
                    onChange={this.props.onChange} widgetEnabled={false} />

            <div className="remove-hint-container">
                <a href="#" className="simple-button orange"
                        onClick={function() {
                            this.props.onRemove();
                            return false;
                        }.bind(this)}>
                    <span className="icon-trash" /> Remove this hint
                </a>
            </div>
        </div>;
    },

    focus: function() {
        this.refs.editor.focus();
    },

    toJSON: function(skipValidation) {
        return this.refs.editor.toJSON(skipValidation);
    }
});

var AnswerAreaEditor = React.createClass({
    getDefaultProps: function() {
        return {
            type: "input-number",
            options: {},
            calculator: false
        };
    },

    render: function() {
        var cls;
        if (this.props.type === "multiple") {
            cls = Editor;
        } else {
            cls = Perseus.Widgets._widgetTypes[this.props.type + "-editor"];
        }

        var editor = cls(_.extend({
            ref: "editor",
            onChange: function(newProps, cb) {
                var options = _.extend({}, this.props.options, newProps);
                this.props.onChange({options: options}, cb);
            }.bind(this)
        }, this.props.options));

        return <div className="perseus-answer-editor">
            <label>
                Show calculator:
                <input type="checkbox" checked={this.props.calculator}
                    onChange={function(e) {
                        this.props.onChange({calculator: e.target.checked});
                    }.bind(this)} />
            </label>
            <label>
                Answer type:
                <select value={this.props.type}
                        onChange={function(e) {
                            this.props.onChange({
                                type: e.target.value,
                                options: {}
                            }, function() {
                                this.refs.editor.focus();
                            }.bind(this));
                        }.bind(this)}>
                    <option value="radio">Multiple choice</option>
                    <option value="table">Table of values</option>
                    <option value="input-number">Text input (number)</option>
                    <option value="expression">Expression / Equation</option>
                    <option value="multiple">Custom format</option>
                </select>
            </label>
            {editor}
        </div>;
    },

    toJSON: function(skipValidation) {
        // Could be just _.pick(this.props, "type", "options"); but validation!
        return {
            type: this.props.type,
            options: this.refs.editor.toJSON(skipValidation),
            calculator: this.props.calculator
        };
    }
});

})(Perseus);
