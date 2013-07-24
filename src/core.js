(function(undefined) {

var Perseus = window.Perseus = {};

Perseus.init = function(options) {
    _.defaults(options, {
        // Pass skipMathJax: true if MathJax is already loaded and configured.
        skipMathJax: false
    });

    var deferred = $.Deferred();

    markedReact.setOptions({
        sanitize: true
    });

    if (options.skipMathJax) {
        deferred.resolve();
    } else {
        MathJax.Hub.Config({
            messageStyle: "none",
            skipStartupTypeset: "none",
            "HTML-CSS": {
                availableFonts: ["TeX"],
                imageFont: null,
                scale: 100,
                showMathMenu: false
            }
        });

        MathJax.Hub.Configured();
        MathJax.Hub.Queue(deferred.resolve);
    }

    return deferred;
};

Perseus.create = function (type, rootEl, options) {
    return new PerseusItem(type, rootEl, options || {});
};

var PerseusItem = function (type, rootEl, options) {
    var self = this;
    self.item = new Perseus.ItemData();
    self.rootEl = rootEl;
    self.isRenderer = type === "renderer";
    var isEditor = self.isEditor = type === "editor";
    var rendererEl = isEditor ? document.createElement("div") : rootEl;
    self.renderer = React.renderComponent(Perseus.ItemRenderer({
        item: self.item,
        problemNum: options.problemNum,
        initialHintsVisible: isEditor ? -1 : options.initialHintsVisible
    }), rendererEl);

    var json = options.json;
    if (!json || _.isEmpty(json)) {
        json = Perseus.ItemData.defaultEditorJson();
    }
    self.setStoredData(json);
};

_.extend(PerseusItem.prototype, {
    scoreInput: function () {
        return this.renderer.scoreInput();
    },
    setStoredData: function (json) {
        var self = this;
        self.item.setStoredData(json);

        // XXX
        if (self.isEditor) {
            var editorProps = _.extend({
                item: self.item,
                renderer: self.renderer,
            }, json);
            self.editor = React.renderComponent(
                    Perseus.ItemEditor(editorProps), self.rootEl);
        }
    },
    getStoredData: function () {

        // XXX
        return this.editor.toJSON(true);
    },
    focus: function () {
        this.renderer.focus();
    },
    getNumHints: function () {
        return this.item.hints.length;
    },
    showHint: function () {
        this.renderer.showHint();
    }
});

})();
