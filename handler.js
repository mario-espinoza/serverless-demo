'use strict';

const MongoClient = require('mongodb').MongoClient;

let atlas_connection_uri;
let cachedDb = null;

module.exports.hello = (event, context, callback) => {
	const response = {
		statusCode: 200,
		body: JSON.stringify({
			message: 'Go Serverless v1.0! Your function executed successfully!',
			input: event,
		}),
	};

	callback(null, response);
};

module.exports.scores = (event, context, callback) => {
	const uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];

	if (atlas_connection_uri == null) {
		atlas_connection_uri = uri;
		console.log('the Atlas connection string is ' + atlas_connection_uri);
	}

	return processEvent(event, context, callback);
};

function connectToDatabase(uri) {

	if (cachedDb && cachedDb.serverConfig.isConnected()) {
		console.log('=> using cached database instance');
		return Promise.resolve(cachedDb);
	}

	return MongoClient.connect(uri)
		.then(db => { cachedDb = db; return cachedDb; });
}


