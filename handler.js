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

const startProcessor = (event) => new Promise((resolve, reject) => {
	
	let players = getPlayers(event);
	
	if (!players) {
		return reject('missing parameters');
	}

	let match = {
		players : players
	};

	cachedDb.collection('matches').insertOne(match, (err, result) => {
		if (err) {
			return reject(err);
		}
		resolve(result);
	});
});

const getPlayers = (event) => {
	if (!event.pathParameters) {
		return ;
	}
	let enemy = event.pathParameters.enemy;
	let player = event.pathParameters.player;

	if (!enemy || !player) {
		return ;
	}

	let players = [player,enemy].sort();
	return players;
};

const resultsProcessor = (event) => new Promise((resolve, reject) => {
	
	let players = getPlayers(event);

	if (!players) {
		return reject('missing parameters');
	}

	let filter = {
		players : {
			$in : players
		}
	};

	cachedDb.collection('matches').findOne(filter, (err, match) => {
		if (err) {
			return reject(err);
		}

		if (!match) {
			return reject('match not found');
		}
		resolve(match);
	});
});

const processors = {
	start: startProcessor,
	score: '',
	results: resultsProcessor
};

const endpoints = {
	hello: '/hello',
	start: '/start/{myPlayer}/{enemy}',
	score: '/score/{myPlayer}/{enemy}',
	results: '/results/{myPlayer}/{enemy}',
};

const getProcessor = (event) => {
	let httpMethod = event.httpMethod;
	let path = event.path;

	if (path === endpoints.start && httpMethod === 'POST') {
		return processors.start;
	}

	if (path === endpoints.score && httpMethod === 'POST') {
		return processors.score;
	}

	if (path === endpoints.results && httpMethod === 'GET') {
		return processors.results;
	}

	return;
};

const errorHandler = cb => err => {
	console.log('=> an error occurred: ', err);
	cb(err);
};

function processEvent(event, context, callback) {

	let processor = getProcessor(event);

	if (!processor) {
		return errorHandler(callback)('invalid endpoint');
	}

	connectToDatabase(atlas_connection_uri)
		.then(db => db && processor(event)())
		.then(result => {
			console.log('query results: ', result);
			callback(null, result);
		})
		.catch(errorHandler(callback));
}

function connectToDatabase(uri) {

	if (cachedDb && cachedDb.serverConfig.isConnected()) {
		console.log('=> using cached database instance');
		return Promise.resolve(cachedDb);
	}

	return MongoClient.connect(uri)
		.then(db => { cachedDb = db; return cachedDb; });
}


