(function(Perseus) {

var ItemData = Perseus.ItemData = function (item) {
    this.callbacks = [];
    this.setItemData(item || this.defaultItemData());
};

ItemData.version = "0.1";

// XXX: need to get editor on new format
ItemData.defaultEditorJson = function () {
    return {
        question: {},
        answerArea: {},
        hints: [],
        timeline: null,
        correctAnswer: null,
        smartHints: {},
        lastSmartHintId: 0
    };
};

_.extend(ItemData.prototype, {

    properties: ["version", "question", "answer", "calculator",
                 "hints", "smartHints", "widgets", "lastSmartHintId"],

    defaultItemData: function () {
        return {
            version: ItemData.version,
            question: "",
            answer: "",
            calculator: false,
            hints: [],
            smartHints: {},
            widgets: [],
            lastSmartHintId: 0
        };
    },

    onChange: function (cb) {
        this.callbacks.push(cb);
    },

    change: function(cb) {
        var self = this;
        _.each(self.callbacks, function (callback) {
            callback(self.getItemData(), cb);
        });
    },

    // XXX similar to normalize guess, need to normalize item data.
    // XXX need a per widget to transform item data to and from stored from.
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
        data.smartHints = self.squashHints(data.smartHints);
        _.extend(self, data);
        self.change();
    },

    getDataFromOld: function (old) {
        var data = {};
        data.version = ItemData.version;

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
        data.smartHints = old.smartHints || {};
        return data;
    },

    getItemData: function () {
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
        var id = _.find(Object.keys(self.smartHints), function (id) {
            return self.isGuessEqualTo(guess, self.smartHints[id].guesses[0].guess);
        })
        if(id != null) {
            return self.smartHints[id];
        }
        else {
            return null;
        }
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

    updatePropsWithSmartHint: function (id) {
        this.updatePropsWithGuess(this.smartHints[id].guesses[0].guess);
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
    },

    changeCorrectAnswer: function (guess) {
        this.correctAnswer = guess;
        this.change();
    },

    addSmartHint: function(guess, hint) {
        //TODO(annie): gracefully prevent overwriting correct answers with hints
        var correct = this.correctAnswer;
        if (correct && this.isGuessEqualTo(guess, correct)) {
            window.alert("You cannot overwrite the correct answer with your hint!")
        }
        else {
            var matchHint = this.findSmartHint(guess);
            if (matchHint) {
                matchHint.hint = hint;
            }
            else {
                this.lastSmartHintId++;
                this.smartHints[this.lastSmartHintId] = {guesses: [{guess: guess, percent: 0}], hint: hint};
            }
        }
        this.change();
    },
    squashHints: function(oldHints) {
        newHints = {};
        _.each(oldHints, function(hint, id){
           if (hint.guesses.length > 1 || hint.hint) {
               newHints[id] = hint;
               delete oldHints[id];
           } 
        });
        var topHintId = this.getTopHint(oldHints);
        while (topHintId != -1) {
            thisHint = oldHints[topHintId];
            delete oldHints[topHintId];
            match = _.find(Object.keys(newHints), _.bind(function(id) {
                return this.isGuessEqualTo(newHints[id].guesses[0].guess, thisHint.guesses[0].guess);
            }, this));
            if (match) {
                newHints[match].guesses = newHints[match].guesses.concat(thisHint.guesses);
            }
            else {
                newHints[topHintId] = thisHint;
            }
            
            topHintId = this.getTopHint(oldHints);
        }
       return newHints;
    },
    
    getTopHint: function(hintDict) {
        keys = Object.keys(hintDict);
        maxPercent = -1;
        maxPercentId = -1;
        percentTotals = this.percentTotals(hintDict);
        _.each(percentTotals, function(hint) {
            if (hint.percent > maxPercent) {
                maxPercent = hint.percent;
                maxPercentId = hint.id;
            }
        });
        return maxPercentId;
    },
    
    percentTotals: function(hintDict) {
        return Object.keys(hintDict).map(_.bind(function(id) {
                    return {id: id, percent: this.percentTotal(hintDict[id])};
                }, this));
    },
    
    percentTotal : function(hint) {
        return hint.guesses.map(function(val) {
                                return val.percent;
                            }).reduce( function(previousValue, currentValue) {
                                return previousValue + currentValue;
                            });
    }
});

})(Perseus);
