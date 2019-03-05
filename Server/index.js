const express = require('express');
const app = express();

function get_flight_snapshots(req, res) {
    var MongoClient = require('mongodb').MongoClient;

    var dbClient;
    MongoClient.connect('mongodb://localhost:27017/recordings', function (err, client) {
        dbClient = client;
    });

    var db = dbClient.db('recordings');
    var queryResult;
    db.collection('mockFlights').find().toArray(function (err, result) {
        queryResult = result;
    });

   return res.json({'snapshots': queryResult});
}

app.get('/', (req, res) => get_flight_snapshots(req, res));

const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));