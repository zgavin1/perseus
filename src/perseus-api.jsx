module.exports = {
    Options: {
        propTypes: React.PropTypes.shape({
            interceptInputFocus: React.PropTypes.func,
            onInputError: React.PropTypes.func.isRequired,
            onFocusChange: React.PropTypes.func.isRequired
        }).isRequired,

        defaults: {
            interceptInputFocus: null,
            onInputError: function() { },
            onFocusChange: function() { }
        }
    },
    ClassNames: {
        INPUT: "perseus-input",
        FOCUSED: "perseus-focused",
        RADIO: {
            OPTION: "perseus-radio-option",
            SELECTED: "perseus-radio-selected",
            OPTION_CONTENT: "perseus-radio-option-content"
        }
    }
};

