/** @jsx React.DOM */
(function(Perseus) {

var ItemData = Perseus.ItemData = function (item) {
    this.callbacks = [];
    if (item)
        this.setItemData(item);
};

_.extend(ItemData.prototype, {
    version: "0.1",

    properties: ["question", "answer", "calculator",
                 "hints", "smartHints", "widgets"],

    onChange: function (cb) {
        this.callbacks.push(cb);
    },

    change: function(cb) {
        var self = this;
        _.each(self.callbacks, function (callback) {
            callback(self.cloneItemData(), cb);
        });
    },

    setItemData: function(data) {
        var self = this;
        if (! data.version) {
            data = self.getDataFromOld(data);
        }
        data.widgets = _.map(data.widgets, function (widget) {
            widget.constructor = Perseus.Widgets._widgetTypes[widget.type];
            widget.props = widget.json;     // XXX: transformation?
            return widget;
        });
        _.extend(self, data);
        self.change();
    },

    getDataFromOld: function (old) {
        var data = {};
        data.version = self.version;

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
            data[location] = content;
        });
        data.calculator = old.answerArea.calculator || false;
        data.widgets = widgets;
        data.hints = old.hints || [];

        // XXX: not really old, should be done in new
        data.correctAnswer = old.correctAnswer;
        data.smartHints = old.smartHints || [];
        return data;
    },

    cloneItemData: function () {
        var data = _.pick(this, this.properties);
        data.widgets = _.map(data.widgets, function (widget) {
            widget = _.clone(widget);
            widget.props = _.clone(widget.props);
            return widget;
        });
        return data;
    },

    updateWidget: function(widgetId, newProps, cb) {
        var widgets = this.widgets;
        var widget = _.find(widgets, function (widget) {
            return widget.id === widgetId;
        });
        _.extend(widget.props, newProps);
        this.change(cb);
    },

    updateComponents: function(componentMap) {
        _.each(this.widgets, function (widget) {
            widget.component = componentMap[widget.id];
        });
    },

    isGuessEqualTo: function (guess, compareToGuess) {
        var self = this;
        var norm = self.normalizeGuess(guess);
        var normCompare = self.normalizeGuess(compareToGuess);
        return _.every(self.widgets, function (widget, i) {
            return widget.constructor.isGuessEqualTo(
                    norm[i], normCompare[i], widget.props);
        });
    },

    isGuessCompleted: function (guess) {
        var self = this;
        var norm = self.normalizeGuess(guess);
        return _.every(self.widgets, function (widget, i) {
            return widget.constructor.isGuessCompleted(norm[i], widget.props);
        });
    },

    isGuessCorrect: function (guess) {
        return this.isGuessEqualTo(guess, this.correctAnswer);
    },

    findSmartHint: function (guess) {
        var self = this;
        return _.find(self.smartHints, function (hint) {
            return self.isGuessEqualTo(guess, hint.guess);
        });
    },

    updatePropsWithGuess: function (guess) {
        var self = this;
        var normalized = self.normalizeGuess(guess);
        _.each(self.widgets, function (widget, i) {
            var props = _.clone(widget.props);
            widget.props = widget.constructor.updatePropsWithGuess(
                    normalized[i], props) || props;
        });
        self.change();
    },

    updatePropsWithCorrect: function() {
        this.updatePropsWithGuess(this.correctAnswer);
    },

    updatePropsWithSmartHint: function (index) {
        this.updatePropsWithGuess(this.smartHints[index].guess);
    },

    normalizeGuess: function (guess) {
        var self = this;
        return _.map(self.widgets, function (widget, i) {
            var constructor = widget.constructor;
            var guessPart = guess[i];
            if (_.has(guessPart, "version") && _.has(guessPart, "guess")) {
                var g = guessPart.guess;
                var version = guessPart.version;
            } else {
                var g = guessPart;
                var version = 0;
            }
            if (constructor.normalizeGuess) {
                if (constructor.version !== version) {
                    g = constructor.normalizeGuess(g, version, widget.props);
                }
            }
            return g;
        });
    },

    normalizeGuessJson: function (json) {
        var self = this;
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
        return json;
    },

    scoreGuess: function(guess) {
        var self = this;
        var completed = self.isGuessCompleted(guess);
        var score = {
            completed: true,
            correct: true,
            hint: null
        };
        if (!completed) {
            score.completed = false;
            return score;
        };
        var correct = self.isGuessCorrect(guess);
        if (correct) {
            return score;
        }

        score.correct = false;

        var hint = self.findSmartHint(guess);
        if (hint && hint.hint)
            score.hint = hint.hint;

        return score;
    }

});

})(Perseus);
