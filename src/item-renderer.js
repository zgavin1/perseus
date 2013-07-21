/** @jsx React.DOM */
(function(Perseus) {

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

var ItemRenderer = Perseus.ItemRenderer = React.createClass({
    version: "0.1",
    getDefaultProps: function() {
        return {
            initialHintsVisible: 0
        };
    },

    getInitialState: function() {
        window.renderer = this;
        return {
            hintsVisible: this.props.initialHintsVisible
        };
    },

    setItem: function(item) {
        var self = this;
        if (! item.version) {
            item = self.getItemFromOld(item);
        }
        item.widgets = _.map(item.widgets, function (widget) {
            widget.constructor = Perseus.Widgets._widgetTypes[widget.type];
            widget.props = widget.json;     // XXX: transformation?
            return widget;
        });
        self.item = item;
        self.update();
    },

    getItemFromOld: function (old) {
        var item = {};
        item.version = self.version;

        var idCounter = 0;
        var idMap = [];
        var widgets = [];
        var getWidgets = function (oldWidgets, location) {
            var newWidgets = _.map(oldWidgets, function (widget, oldId) {
                var id = idCounter;
                idCounter += 1;
                idMap.push({
                    location: location,
                    id: id,
                    oldId: oldId,
                    type: widget.type
                });
                return {
                    id: id,
                    location: location,
                    json: widget.options,
                    type: widget.type
                };
            });
            widgets = widgets.concat(newWidgets);
        };
        getWidgets(old.question.widgets, "question");
        if (old.answerArea.type === "multiple") {
            var answer = old.answerArea.options.content;
            var answerWidgets = old.answerArea.options.widgets;
        } else {
            var id = old.answerArea.type+" 1";
            var answer = "[[\u2603 "+id+"]]";
            var answerWidgets = {};
            answerWidgets[id] = _.pick(old.answerArea, "options", "type");
        }
        getWidgets(answerWidgets, "answer");
        var content = {
            question: old.question.content,
            answer: answer
        };
        _.each(content, function (content, location) {
            _.each(idMap, function (map) {
                if (map.location === location) {
                    content = content.replace(map.oldId, map.type+":"+map.id);
                }
            });
            item[location] = content;
        });
        item.calculator = old.answerArea.calculator || false;
        item.widgets = widgets;
        item.hints = old.hints || [];

        // XXX: not really old, should be done in new
        item.correctAnswer = old.correctAnswer || [];
        item.smartHints = old.smartHints || [];
        return item;
    },

    cloneItem: function (item) {
        item = _.clone(item);
        item.widgets = _.map(item.widgets, function (widget) {
            widget = _.clone(widget);
            widget.props = _.clone(widget.props);
            return widget;
        });
        return item;
    },

    update: function(cb) {
        // Since the item renderer works by rendering things into three divs
        // that have completely different places in the DOM, we have to do this
        // strangeness instead of relying on React's normal render() method.
        // TODO(alpert): Figure out how to clean this up somehow

        var item = this.cloneItem(this.item);
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
        var widgets = this.item.widgets;
        var widget = _.find(widgets, function (widget) {
            return widget.id === widgetId;
        });
        _.extend(widget.props, newProps);
        this.update(cb);
    },

    postUpdate: function() {
        var self = this;
        window.renderer = self;
        console.log("Post update");
        var widgets = [];
        widgets = widgets.concat(self.questionRenderer.getWidgets());
        widgets = widgets.concat(self.answerAreaRenderer.getWidgets());
        var widgetsMap = {};
        _.each(widgets, function (widget) {
            widgetsMap[widget.id] = widget.component;
        });
        _.each(self.item.widgets, function (widget) {
            widget.component = widgetsMap[widget.id];
        });
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

    isGuessEquivalent: function (guessA, guessB) {
        var self = this;
        var normA = self.normalizeGuess(guessA);
        var normB = self.normalizeGuess(guessB);
        return _.every(self.item.widgets, function (widget, i) {
            return widget.constructor.isGuessEquivalent(normA[i], normB[i]);
        });
    },

    isGuessCompleted: function (guess) {
        var self = this;
        var norm = self.normalizeGuess(guess);
        return _.every(self.item.widgets, function (widget, i) {
            return widget.constructor.isGuessCompleted(norm[i]);
        });
    },

    showGuess: function (guess) {
        var self = this;
        var normalized = self.normalizeGuess(guess);
        _.each(self.item.widgets, function (widget, i) {
            var props = _.clone(widget.props);
            widget.props = widget.constructor.guessToProps(
                    normalized[i], props);
        });
        self.update();
    },

    normalizeGuess: function (guess) {
        var self = this;
        return _.map(self.item.widgets, function (widget, i) {
            var constructor = widget.constructor;
            var guessPart = guess[i];
            if (_.has(guessPart, "version") && _.has(guessPart, "guess")) {
                var g = guessPart.guess;
                var version = guessPart.version;
            } else {
                var g = guessPart;
                var version = 0;
            }
            if (constructor.normalizeGuessJson) {
                if (constructor.version !== version) {
                    g = constructor.normalizeGuessJson(g, version, widget.props);
                }
            }
            return g;
        });
    },

    showGuessFromJson: function (json) {
        var self = this;
        var widgets = self.item.widgets;
        if (! _.isArray(json)) {
            // old guess format had json of the single
            // answer widget
            json = [[], [json]];
        }

        var g = json[0];
        var updatedFormat = g && _.isObject(g)
                            && _.has(g, "guess") && _.has(g, "values");
        if (updatedFormat) {
            // TODO(jakesandlund):
            // assuming that the flattened array has the same
            // order of widgets?
            json = _.flatten(json, true);
        }
        var guess = json;
        self.showGuess(guess);
    },

    showCorrect: function() {
        this.showGuess(this.item.correctAnswer);
    },

    showSmartHint: function (index) {
        this.showGuess(this.item.smartHints[index].guess);
    },

    scoreInput: function() {
        console.log("scoreInput");
        var self = this;
        var guess = self.getGuess();
        var completed = self.isGuessCompleted(guess);
        if (!completed) {
            // XXX
            window.alert("Incomplete answer");
            return {
                empty: true,
                correct: false,
                message: null,  // TODO: do we use?: score.message,
                guess: guess
            };
        };
        var correctAnswer = self.item.correctAnswer;
        var correct = self.isGuessEquivalent(guess, correctAnswer);

        if (!correct) {
            var hint = _.find(self.item.smartHints, function (hint) {
                return self.isGuessEquivalent(guess, hint.guess);
            });
            if (hint.hint)
                window.alert(hint.hint);
        }

        return {
            empty: false,
            correct: correct,
            message: null,   // TODO: score.message,
            guess: {
                guess: guess,
                version: self.version
            }
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

})(Perseus);
