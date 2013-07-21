/** @jsx React.DOM */
(function(Perseus) {

var ItemRenderer = Perseus.ItemRenderer = React.createClass({
    getDefaultProps: function() {
        return {
            initialHintsVisible: 0
        };
    },

    getInitialState: function() {
        window.renderer = this;
        this.item = this.props.item || new Perseus.ItemData(this.props);
        this.item.onChange(_.bind(this.update, this));
        return {
            hintsVisible: this.props.initialHintsVisible
        };
    },

    componentDidMount: function () {
        this.item.change();
    },

    update: function(item, cb) {
        // Since the item renderer works by rendering things into three divs
        // that have completely different places in the DOM, we have to do this
        // strangeness instead of relying on React's normal render() method.
        // TODO(alpert): Figure out how to clean this up somehow

        var question = {
            content: item.question,
            updateWidget: this.updateWidget
        };
        question.widgets = _.filter(item.widgets, function (widget) {
            return widget.location === "question";
        });
        this.questionRenderer = React.renderComponent(
                Perseus.WidgetsRenderer(question),
                document.getElementById("workarea"));

        var answer = {
            content: item.answer,
            calculator: item.calculator,
            problemNum: this.props.problemNum,
            updateWidget: this.updateWidget
        };
        answer.widgets = _.filter(item.widgets, function (widget) {
            return widget.location === "answer";
        });
        this.answerAreaRenderer = React.renderComponent(
                AnswerAreaRenderer(answer),
                document.getElementById("solutionarea"));

        this.hintsRenderer = React.renderComponent(
                HintsRenderer({
                    hints: item.hints,
                    hintsVisible: this.state.hintsVisible
                }),
                document.getElementById("hintsarea"));

        if (cb) {
            cb();
        }
        this.postUpdate();
    },

    updateWidget: function(widgetId, newProps, cb) {
        this.item.updateWidget(widgetId, newProps, cb);
    },

    postUpdate: function() {
        var self = this;
        var widgets = [];
        widgets = widgets.concat(self.questionRenderer.getWidgets());
        widgets = widgets.concat(self.answerAreaRenderer.getWidgets());
        var componentMap = {};
        _.each(widgets, function (widget) {
            componentMap[widget.id] = widget.component;
        });
        self.item.updateComponents(componentMap);
    },

    getGuess: function() {
        var self = this;
        return _.map(self.item.widgets, function (widget) {
            var guess = widget.component.getGuess();
            return {
                guess: guess,
                version: widget.constructor.version
            };
        });
    },

    showGuess: function (guess) {
        this.item.updatePropsWithGuess(guess);
    },

    showGuessFromJson: function (json) {
        var self = this;
        var guess = self.item.normalizeGuessJson(json);
        self.showGuess(guess);
    },

    showCorrect: function() {
        this.item.updatePropsWithCorrect();
    },

    showSmartHint: function (id) {
        this.item.updatePropsWithSmartHint(id);
    },

    scoreInput: function() {
        var self = this;
        var guess = self.getGuess();
        var score = self.item.scoreGuess(guess);
        if (!score.completed) {
            // XXX
            window.alert("Incomplete answer");
            return {
                empty: true,
                correct: false,
                message: null,  // TODO: do we use?: score.message,
                guess: guess
            };
        };

        // XXX
        if (score.hint)
            window.alert(score.hint);

        return {
            empty: false,
            correct: score.correct,
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
        return this.item.hints.length;
    },

});


// TODO(alpert): Thread problemNum to question-area widgets too

var AnswerAreaRenderer = React.createClass({
    render: function(rootNode) {
        return Perseus.WidgetsRenderer(_.extend({ref: "widget"}, this.props));
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
        if ($("#examples-show").length) {
            $("#examples-show").hide();
            React.unmountAndReleaseReactRootNode(
                    document.getElementById("examples"));
        }
    },

    focus: function() {
        this.refs.widget.focus();
    },

    getWidgets: function() {
        return this.refs.widget.getWidgets();
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

})(Perseus);
