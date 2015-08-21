/**
 * Identifies whether or not a given perseus item requires the use of a mouse
 * or screen, based on the widgets it contains.
 */

var _ = require("underscore");

var Traversal = require("./traversal.jsx");
var Widgets = require("./widgets.js");
var Util = require("./util.js");

module.exports = {
    // Returns a list of widgets that cause a given perseus item to require
    // the use of a screen or mouse.
    //
    // For now we'll just check the `accessible` field on each of the widgets
    // in the item data, but in the future we may specify accessibility on
    // each widget with higher granularity.
    violatingWidgets: function(itemData) {
        // TODO(jordan): Hints as well
        var widgets = [];

        // Traverse the question data
        var maybeAddWidget = function(info) {
            if (info.type && !Widgets.isAccessible(info)) {
                widgets.push(info.type);
            }
        };

        var rendererType = Util.getItemRendererType(itemData);
        if (rendererType === "simple") {
            Traversal.traverseRendererDeep(
                itemData.question, null, maybeAddWidget
            );
        } else if (rendererType === "multi") {
            _.each(itemData.questions, function(question) {
                Traversal.traverseRendererDeep(
                    question, null, maybeAddWidget
                );
            });

            if (itemData.context) {
                Traversal.traverseRendererDeep(
                    itemData.context, null, maybeAddWidget
                );
            }
        } else {
            throw new Error("Invalid item renderer type: " + rendererType);
        }

        // Uniquify the list of widgets (by type)
        return _.uniq(widgets);
    }
};
