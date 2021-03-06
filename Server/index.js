const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

function get_db(dbName) {
    var MongoClient = require('mongodb').MongoClient;
    return new Promise(function(resolve, reject) {
        MongoClient.connect('mongodb://localhost:27017/recordings')
            .then(function (client) {
                var db = client.db(dbName);
                resolve(db);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function get_flight_snapshots_at_time(req, res) {
    let collectionName = req.params['collectionName'];
    let time = +req.params['time'];
    let epsilon = 10;
    let timeLowerBound = time - epsilon;
    let timeUpperBound = time + epsilon;

    get_db('recordings')
        .then(function (db) {
            return db.collection(collectionName).find({'time': {$gte: timeLowerBound, $lte: timeUpperBound}}).toArray();
        })
        .then(function (result) {
            let closestSnapshots = {};
            let closestDiffs = {};
            for (let snapshot of result) {
                let id = snapshot['id'];
                let diff = Math.abs(snapshot['time'] - time);
                if (closestDiffs[id] == null || diff < closestDiffs[id]) {
                    closestDiffs[id] = diff;
                    closestSnapshots[id] = snapshot;
                }
            }

            let finalResult = [];
            for (let snapshot of Object.values(closestSnapshots)) {
                finalResult.push(snapshot);
            }
            res.json({'snapshots': finalResult});
        })
        .catch(function (error) {
            console.log(error);
        });
}

function get_flight_snapshots_in_timespan(req, res) {
    let collectionName = req.params['collectionName'];
    let startTime = +req.params['start'];
    let endTime = +req.params['end'];

    get_db('recordings')
        .then(function (db) {
            return db.collection(collectionName).find({'time': {$gte: startTime, $lte: endTime}}).toArray();
        })
        .then(function (result) {
            res.json({'snapshots': result});
        })
        .catch(function (error) {
            console.log(error);
        });
}

function get_flight_snapshots_in_timespan_in_polygon(req, res) {
    let collectionName = req.params['collectionName'];
    let startTime = +req.params['start'];
    let endTime = +req.params['end'];
    let polygonId = req.params['polygonId'];

    get_db('recordings')
        .then(function (db) {
            return db.collection(collectionName).find({'time': {$gte: startTime, $lte: endTime}}).toArray();
        })
        .then(function (result) {
            res.json({'snapshots': result});
        })
        .catch(function (error) {
            console.log(error);
        });
}

function get_flight_snapshots_for_id(req, res) {
    let collectionName = req.params['collectionName'];
    let id = +req.params['id'];

    get_db('recordings')
        .then(function (db) {
            return db.collection(collectionName).find({'id': id}).toArray();
        })
        .then(function (result) {
            res.json({'snapshots': result});
        })
        .catch(function (error) {
            console.log(error);
        });
}

function get_polygons(req, res) {
    get_db('polygons')
        .then(function (db) {
            return db.collection('countries').find({}).project({_id: 1, 'properties.NAME': 1}).toArray();
        })
        .then(function (result) {
            res.json({'countries': result});
        })
        .catch(function (error) {
            console.log(error);
        });
}

function get_polygon_from_db(polygonId) {
    return new Promise(function(resolve, reject) {
        var mongo = require('mongodb');
        var objectId = new mongo.ObjectID(polygonId);

        get_db('polygons')
            .then(function (db) {
                return db.collection('countries').find({_id: objectId}).toArray();
            })
            .then(function (result) {
                resolve(result);
            })
            .catch(function (error) {
                reject(error);
            });
    });
}

function get_polygon(req, res) {
    let polygonId = req.params['polygonId'];

    get_polygon_from_db(polygonId)
        .then(function (result) {
            res.json({'countries': result});
        })
        .catch(function (error) {
            console.log(error);
        });
}

app.get('/flights/:collectionName/timespan/:start/:end', (req, res) => get_flight_snapshots_in_timespan(req, res));
app.get('/flights/:collectionName/timespan/:start/:end/polygon/polygonId', (req, res) =>
    get_flight_snapshots_in_timespan_in_polygon(req, res));
app.get('/flights/:collectionName/id/:id', (req, res) => get_flight_snapshots_for_id(req, res));
app.get('/polygons', (req, res) => get_polygons(req, res));
app.get('/polygon/:polygonId', (req, res) => get_polygon(req, res));

const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));
