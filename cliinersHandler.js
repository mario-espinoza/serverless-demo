'use strict';

module.exports.handler = (event, context, callback) => {
	const response = {
		statusCode: 200,
		body: JSON.stringify({
			message: 'Cliiner handler',
			input: event,
		}),
	};
	callback(null, response);
};