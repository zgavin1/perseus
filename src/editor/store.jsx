// Redux-style store.

var Immutable = require("../../lib/immutable.min.js");

function store (state, action) {
	if (!state) {
		if (action.type === "initWithJson") {
			state = new Immutable.fromJS({
				json: action.json
			});
		} else {
			state = new Immutable.fromJS({
				json: {
				    "content": "Hi I'm a particle!",
				    "images": {},
				    "widgets": {}
				}
			});
		}
	}
	if (action.type === "change") {
		state = state.set("json", Immutable.fromJS(action.newState.json));
	}
	return state;
}

module.exports = store;