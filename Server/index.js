const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

function get_flight_snapshots(req, res) {
    var MongoClient = require('mongodb').MongoClient;
    let time = req.params['time'];

    MongoClient.connect('mongodb://localhost:27017/recordings', function (err, client) {
        var db = client.db('recordings');
        db.collection('mockFlights').find({'time': 1}).toArray(function (err, result) {
            res.json({'snapshots': result});
        });
    });
}

app.get('/', (req, res) => get_flight_snapshots(req, res));
app.get('/timespan/:time', (req, res) => get_flight_snapshots(req, res));

const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));