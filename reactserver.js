var Perseus = require("./build/node-perseus.js");
// use these instead of the import above when testing
// require("./node/environment.js");
// var Perseus = require("./src/perseus.js");
var React = require("react");
var ReactDOMServer = require("react-dom/server");
var express = require("express");
var fs = require("fs");
var _ = require("underscore");

var app = express();

var defaultArticle = {
    "content": "Hi I'm a particle!",
    "images": {},
    "widgets": {}
};
var defaultExercise = {
    "question": {
        "content": "Boo!",
        "images": {},
        "widgets": {}
    },
    "answerArea": {
        "type": "multiple",
        "options": {
            "content": "",
            "images": {},
            "widgets": {}
        },
        "calculator": false
    },
    "itemDataVersion": {
        "major": 0,
        "minor": 1
    },
    "hints": []
};
var enabledFeatures = {
    highlight: true,
    toolTipFormats: true,
    useMathQuill: true
};

app.get("/article", function(req, res) {
    var content = req.query.content ? JSON.parse(req.query.content) : defaultArticle;

    var rendererProps = {
        json: content,
        enabledFeatures: enabledFeatures,
        apiOptions: {
            enableOldAnswerTypes: true,
            fancyDropdowns: true,
            __onInputError: function() {
                var args = _.toArray(arguments);
                console.log.apply(console, ["onInputError:"].concat(args));
                return true;
            },
            __interceptInputFocus: function() {
                var args = _.toArray(arguments);
                console.log.apply(console, ["interceptInputFocus:"].concat(args));
                return;
            },
            onFocusChange: function(newPath, oldPath) {
                console.log("onFocusChange", newPath, oldPath);
            },
            __staticRender: true
        },
    };

    var rendered = ReactDOMServer.renderToString(
        React.createElement(Perseus.ArticleRenderer, rendererProps)
    );

    var template = fs.readFileSync("serverarticlerender.html", "utf-8");
    var html = template.replace("{%CONTENT%}", rendered).replace("{%PROPS%}", JSON.stringify(rendererProps));
    res.send(html);
});

app.get("/exercise", function(req, res) {
    var question = req.query.content ? JSON.parse(req.query.content) : defaultExercise;

    var rendererProps = {
        item: question,
        problemNum: 2,
        initialHintsVisible: 0,
        enabledFeatures: enabledFeatures,
    };

    var rendered = ReactDOMServer.renderToString(
        React.createElement(Perseus.ServerItemRenderer, rendererProps)
    );

    var template = fs.readFileSync("serverexerciserender.html", "utf-8");
    var html = template.replace("{%CONTENT%}", rendered).replace("{%PROPS%}", JSON.stringify(rendererProps));
    res.send(html);
});

app.use("/", express.static("./"));

var server = app.listen(9002, function() {
    console.log("Listening at http://localhost:9002/");
});
