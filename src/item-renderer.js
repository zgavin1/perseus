/** @jsx React.DOM */
(function(Perseus) {

// TODO(alpert): Thread problemNum to question-area widgets too

var AnswerAreaRenderer = React.createClass({
    getInitialState: function() {
        // TODO(alpert): Move up to parent props?
        return {
            widget: {},
            cls: this.getClass()
        };
    },

    componentWillReceiveProps: function(nextProps) {
        this.setState({cls: this.getClass(nextProps.type)});
    },

    getClass: function(type) {
        type = type || this.props.type;
        if (type === "multiple") {
            return Perseus.Renderer;
        } else {
            return Perseus.Widgets._widgetTypes[type];
        }
    },

    render: function(rootNode) {
        return this.state.cls(_.extend({
            ref: "widget",
            problemNum: this.props.problemNum,
            onChange: function(newProps, cb) {
                var widget = _.extend({}, this.state.widget, newProps);
                this.setState({widget: widget}, cb);
            }.bind(this)
        }, this.props.options, this.state.widget));
    },

    componentDidMount: function() {
        this.$examples = $("<div id='examples'></div>");
        this.update();
    },

    componentDidUpdate: function() {
        this.update();
    },

    update: function() {
        $("#calculator").toggle(this.props.calculator);

        $("#examples-show").hide();
        if ($("#examples-show").data("qtip")) {
            $("#examples-show").qtip("destroy", /* immediate */ true);
        }

        var widget = this.refs.widget;
        var examples = widget.examples ? widget.examples() : null;

        if (examples && $("#examples-show").length) {
            $("#examples-show").append(this.$examples);

            var content = _.map(examples, function(example) {
                return "- " + example;
            }).join("\n");

            React.renderComponent(
                Perseus.Renderer({content: content}), 
                this.$examples[0]);
           
            $("#examples-show").qtip({
                content: {
                    text: this.$examples.remove()
                },
                style: {classes: "qtip-light leaf-tooltip"},
                position: {
                    my: "bottom center",
                    at: "top center"
                },
                show: {
                    delay: 200,
                    effect: {
                        length: 0
                    }
                },
                hide: {delay: 0}
            });

            $("#examples-show").show();
        }
    },

    componentWillUnmount: function() {
        if (this.props.calculator) {
            $("#calculator").hide();
        }
        if (this.state.cls.examples && $("#examples-show").length) {
            $("#examples-show").hide();
            React.unmountAndReleaseReactRootNode(
                    document.getElementById("examples"));
        }
    },

    focus: function() {
        this.refs.widget.focus();
    },

    getWidgets: function() {
        var widget = this.refs.widget;
        if (this.props.type === "multiple") {
            return _.map(widget.getWidgets(), function (widget) {
                widget.id = "answer-" + widget.id;
                return widget;
            });
        }
        return [{
            type: this.props.type,
            component: widget,
            id: "answer"
        }];
    },
});

var HintsRenderer = React.createClass({
    render: function() {
        var hintsVisible = this.props.hintsVisible;
        var hints = this.props.hints
            .slice(0, hintsVisible === -1 ? undefined : hintsVisible)
            .map(function(hint, i) {
                var shouldBold = i === this.props.hints.length - 1 &&
                                 !(/\*\*/).test(hint.content);
                return <div className={shouldBold ? "last-hint" : ""}
                        key={"hint" + i}>
                    {Perseus.Renderer(hint)}
                </div>;
            }, this);

        return <div>{hints}</div>;
    }
});

var ItemRenderer = Perseus.ItemRenderer = React.createClass({
    getDefaultProps: function() {
        return {
            initialHintsVisible: 0
        };
    },

    getInitialState: function() {
        return {
            correctAnswer: [],
            hintsVisible: this.props.initialHintsVisible
        };
    },

    componentDidMount: function() {
        this.update();
    },

    componentDidUpdate: function() {
        this.update();
    },

    update: function() {
        // Since the item renderer works by rendering things into three divs
        // that have completely different places in the DOM, we have to do this
        // strangeness instead of relying on React's normal render() method.
        // TODO(alpert): Figure out how to clean this up somehow

        this.questionRenderer = React.renderComponent(
                Perseus.Renderer(this.props.item.question),
                document.getElementById("workarea"));

        this.answerAreaRenderer = React.renderComponent(
                AnswerAreaRenderer({
                    type: this.props.item.answerArea.type,
                    options: this.props.item.answerArea.options,
                    calculator: this.props.item.answerArea.calculator || false,
                    problemNum: this.props.problemNum,
                    onCorrectAnswerChange: this.props.onCorrectAnswerChange
                }),
                document.getElementById("solutionarea"));

        this.hintsRenderer = React.renderComponent(
                HintsRenderer({
                    hints: this.props.item.hints,
                    hintsVisible: this.state.hintsVisible
                }),
                document.getElementById("hintsarea"));

        this.postUpdate();
    },

    postUpdate: function() {
        console.log("Post update");
        var widgets = [];
        widgets = widgets.concat(this.questionRenderer.getWidgets());
        widgets = widgets.concat(this.answerAreaRenderer.getWidgets());
        this.widgets = _.map(widgets, function (widget) {
            widget.constructor = Perseus.Widgets._widgetTypes[widget.type];
            return widget;
        });
    },

    getGuess: function() {
        var self = this;
        return _.map(self.widgets, function (widget) {
            var json = widget.component.toJSON();
            return widget.constructor.jsonToGuess(json);
        });
    },

    isGuessEquivalent: function (guessA, guessB) {
        var self = this;
        return _.every(self.widgets, function (widget, i) {
            return widget.constructor.isGuessEquivalent(guessA[i], guessB[i]);
        });
    },

    isGuessCompleted: function (guess) {
        var self = this;
        return _.every(self.widgets, function (widget, i) {
            return widget.constructor.isGuessCompleted(guess[i]);
        });
    },

    scoreInput: function() {
        console.log("scoreInput");
        var self = this;
        var guess = self.getGuess();
        console.log(guess);
        self.postUpdate();
        var updatedGuess = self.getGuess();
        console.log(updatedGuess);
        var completed = self.isGuessCompleted(guess);
        console.log(completed);
        if (!completed) {
            return {
                empty: true,
                correct: false,
                message: null,  // TODO: do we use?: score.message,
                guess: guess
            }
        };
        var correctAnswer = self.props.item.correctAnswer;
        console.log(correctAnswer);
        var correct = self.isGuessEquivalent(guess, correctAnswer);
        console.log(correct);

        return {
            empty: false,
            correct: correct,
            message: null,   // TODO: score.message,
            guess: guess
        };
    },

    render: function() {
        return <div />;
    },

    focus: function() {
        return this.answerAreaRenderer.focus();
    },

    componentWillUnmount: function() {
        React.unmountAndReleaseReactRootNode(
                document.getElementById("workarea"));
        React.unmountAndReleaseReactRootNode(
                document.getElementById("solutionarea"));
        React.unmountAndReleaseReactRootNode(
                document.getElementById("hintsarea"));
    },

    showHint: function() {
        if (this.state.hintsVisible < this.getNumHints()) {
            this.setState({
                hintsVisible: this.state.hintsVisible + 1
            });
        }
    },

    getNumHints: function() {
        return this.props.item.hints.length;
    },

});

})(Perseus);
