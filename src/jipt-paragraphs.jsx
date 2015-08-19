/**
 * Paragraph parsing/splitting for article jipt i18n
 */

var _ = require("underscore");

var SimpleMarkdown = require("simple-markdown");

var rules = {
    paragraph: {
        match: SimpleMarkdown.defaultRules.paragraph.match,
        order: 1,
        parse: function(capture, state, parse) {
            return capture[1];
        },
    },
};

var builtParser = SimpleMarkdown.parserFor(rules);

// This should just return an array of strings! magick!
var parse = (source) => {
    var paragraphedSource = source + "\n\n";
    return builtParser(paragraphedSource, {inline: false});
};

module.exports = {
    parse: parse,
};
