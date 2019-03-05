const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

function get_db() {
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect('mongodb://localhost:27017/recordings')
        .then(function (client) {
            var db = client.db('recordings');
            return db;
        });
}

function get_flight_snapshots(req, res) {
    let time = +req.params['time'];
    let epsilon = 10;
    let timeLowerBound = time - epsilon;
    let timeUpperBound = time + epsilon;

    get_db()
        .then(function (db) {
            return db.collection('mockFlights').find({'time': {$gte: timeLowerBound, $lte: timeUpperBound}}).toArray();
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

app.get('/', (req, res) => get_flight_snapshots(req, res));
app.get('/flights/time/:time', (req, res) => get_flight_snapshots(req, res));

const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));