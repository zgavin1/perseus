/*
 * Relocates an image to the servers used
 * by apiOptions.uploadImage.
 * Requires an apiOptions.uploadImage function as a
 * parameter to work.
 */

var _ = require("underscore");

// Regex to recognize graphie-to-png links
var graphieToPNGRegex = /^web\+graphie\:/;

/**
 * Downloads an image from a URL and creates a File
 * object out of it for attaching to an xhr.
 *
 * This is crazy and sort of hacky!
 */
var createImageFileFromURL = (url, callback) => {
    var extension = "";
    var extensionMatch = /\.[^\.]*$/.exec(url);
    if (extensionMatch) {
        extension = extensionMatch[0];
    }

    // First we download the image as binary data:
    // We don't use jQuery because it doesn't support
    // responseType 'blob' or 'arraybuffer'
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, /* async: */ true);
    xhr.responseType = "blob"; // binary data

    xhr.onload = (event) => {
        if (xhr.status !== 200) {
            callback(xhr.status);
            return;
        }

        // Then we create a File object out of that image's data:
        var data = xhr.response;
        var file = new File([data], "upload" + extension, {
            type: xhr.getResponseHeader("content-type") || "",
        });
        callback(null, file);
    };

    xhr.send();
};

var RelocateImage = function(uploadImage, url, callback) {
    if (!uploadImage || !url) {
        _.defer(callback, null);
        return;
    }

    // we can't relocate web+graphie: urls (they are two files
    // and the uploadImage function doesn't necessarily support
    // them). This is unideal for other people using perseus,
    // since it won't relocate those to their servers
    // (although finding random graphie-to-png urls around
    // the web seems extremely unlikely, and they should run
    // their own graphie-to-png if they want graphie images).
    if (graphieToPNGRegex.test(url)) {
        _.defer(callback, url);
        return;
    }

    createImageFileFromURL(url, (error, file) => {
        if (error) {
            callback(null);
            return;
        }

        uploadImage(file, callback);
    });
};

module.exports = RelocateImage;
