/**
 * Paragraph parsing/splitting for article jipt i18n
 */

var _ = require("underscore");

var SimpleMarkdown = require("simple-markdown");

var astRules = {
    // TODO(aria): Figure out whether we need newline here and what
    // it should do
    newline: SimpleMarkdown.defaultRules.newline,
    paragraph: SimpleMarkdown.defaultRules.paragraph,
    text: _.extend({}, SimpleMarkdown.defaultRules.text, {
        match: SimpleMarkdown.inlineRegex(
            /^[\s\S]+?(?=\n\n| {2,}\n|$)/
        ),
    }),
};

var arrayRules = {
    paragraph: {
        match: SimpleMarkdown.defaultRules.paragraph.match,
        order: 1,
        parse: function(capture, state, parse) {
            return capture[1];
        },
    },
};

var builtAstParser = SimpleMarkdown.parserFor(astRules);
var builtArrayParser = SimpleMarkdown.parserFor(arrayRules);

var parseToAst = (source) => {
    return builtAstParser(source + "\n\n", {inline: false});
};

// This should just return an array of strings! magick!
var parseToArray = (source) => {
    return builtParser(source + "\n\n", {inline: false});
};

module.exports = {
    parseToAst: parseToAst,
    parseToArray: parseToArray,
};
