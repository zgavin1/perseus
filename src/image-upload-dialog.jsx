var DragTarget = require("react-components/drag-target.jsx");
var LayeredComponentMixin = require("react-components/layered-component-mixin.jsx");
var React = require("react");
var WindowDrag = require("react-components/window-drag.jsx");
var _ = require("underscore");

var Modal = require("../react-package/modal.jsx");

// Three paned image upload dialog, inspired by imgur's.
var ImageUploadDialog = React.createClass({
    propTypes: {
        onImageReceipt: React.PropTypes.func.isRequired,
        onUrlReceipt: React.PropTypes.func.isRequired,
        onClose: React.PropTypes.func.isRequired
    },
    mixins: [LayeredComponentMixin],
    render: function() {
        return <Modal ref="modal" onClose={this.props.onClose}>
            <div className="modal-header">
                <span className="close" data-dismiss="modal">&#215;</span>
                <h2>Add Image</h2>
            </div>
            <div className="modal-body">

                {/* top-left: browse computer button */}
                <div className="computer-upload-container">
                    <div className="computer-upload-caption-outer">
                        <i className="icon-desktop" />
                        <div className="computer-upload-caption">
                            browse your computer
                        </div>
                    </div>
                    <input type="file"
                           ref="fileInput"
                           name="imgfile"
                           onChange={this.handleBrowse} />
                </div>

                {/* top-right: paste urls textarea */}
                <div className="web-upload-container">
                    <i className="icon-cloud-download" />
                    <input type="text"
                           ref="urlUpload"
                           className="url-upload-container"
                           placeholder="paste a URL to upload from web"
                           onChange={this.handleUrlInput}
                           onKeyPress={this.handleUrlKeypress} />
                </div>

                {/* bottom: drag-n-drop */}
                <div className="drag-upload-container">
                    <i className="icon-bullseye" />
                    <div className="drag-upload-message">
                        drag and drop here
                    </div>
                </div>

            </div>
        </Modal>;
    },

    // "upload" overlay that covers the whole screen - shown when there is a
    // drag happening.
    renderLayer: function() {
        return <WindowDrag>
            <DragTarget className="screen-filling-drag-target"
                        onDrop={this.handleDrop}
                        shouldDragHighlight={() => false}>
                <div className="drag-target-active-message">upload</div>
            </DragTarget>
        </WindowDrag>;
    },

    getInitialState: function() {
        return { url: "" };
    },

    handleUrlInput: function(event) {
        this.setState({ url: event.target.value });
    },

    handleUrlKeypress: function(event) {
        if (event.key === "Enter") {
            this.props.onUrlReceipt(this.state.url);
            this.props.onClose();
        }
    },

    handleBrowse: function(event) {
        var images = _(event.target.files)
            .filter(file => file.type.match('image.*'));
        this.props.onImageReceipt(images);
        this.props.onClose();
    },

    handleDrop: function(event) {
        var dataTransfer = event.nativeEvent.dataTransfer;

        // files will hold something if the drag was from the desktop or a file
        // located on the user's computer.
        var files = dataTransfer.files;

        // ... but we only get a url if the drag originated in another window
        if (files.length === 0) {
            this.props.onUrlReceipt(dataTransfer.getData("URL"));
            this.props.onClose();

        // drag originated on user's computer - we have files
        } else {
            var images = _(files).filter(file => file.type.match('image.*'));
            this.props.onImageReceipt(images);
            this.props.onClose();
        }
    },

    componentDidMount: function() {
        this.refs.urlUpload.getDOMNode().focus();
    }
});

module.exports = ImageUploadDialog;
