'use strict';

const MongoClient = require('mongodb').MongoClient;

let atlas_connection_uri;
let cachedDb = null;

module.exports.anonymous = (event, context, callback) => {

	let vote = getValidVote(event);
	if (!vote) {
		callback('candidate undefined');
	}

	setUpDB();

	return processData(null, getResults, callback);
};

module.exports.candidate = (event, context, callback) => {
	
	let candidate = getValidCandidate(event);
	if (!candidate) {
		callback('candidate undefined');
	}

	setUpDB();
	return processData(candidate, voteCandidate, callback);
};

module.exports.results = (event, context, callback) => {
	setUpDB();
	return processData(null, getResults, callback);
};

function setUpDB() {
	const uri = process.env['MONGODB_ATLAS_CLUSTER_URI'];
	
	if (atlas_connection_uri == null) {
		atlas_connection_uri = uri;
		console.log('the Atlas connection string is ' + atlas_connection_uri);
	}
}

function connectToDatabase(uri) {
	
	if (cachedDb && cachedDb.serverConfig.isConnected()) {
		console.log('=> using cached database instance');
		return Promise.resolve(cachedDb);
	}
  
	return MongoClient.connect(uri)
		.then(db => { cachedDb = db; return cachedDb; });
}

function getValidCandidate(event) {
	var candidate = null;
	if (event) {
		let path = event.path;
		candidate = path.candidate;
	}
	return candidate;
}

const getResults = (db, data) => new Promise((resolve, reject)=> {
	db.collection('votes').aggregate;
});

const voteAnonymous = (db, vote) => new Promise((resolve, reject)=> {
	db.collection('votes').insertOne(vote);
});

const voteCandidate = (db, candidate) => new Promise((resolve, reject)=> {
	let vote = {
		candidate : candidate
	};
	db.collection('votes').insertOne(vote);
});

function processData(data, operation, callback) {
    
	connectToDatabase(atlas_connection_uri)
		.then(db => operation(db ,data))
		.then(result => {
			console.log('query results: ', result);
			callback(null, result);
		})
		.catch(err => {
			console.log('=> an error occurred: ', err);
			callback(err);
		});
}