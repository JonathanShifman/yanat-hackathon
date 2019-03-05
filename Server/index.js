const express = require('express');
const app = express();

function f(req, res) {
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect('mongodb://localhost:27017/recordings', function (err, client) {
        if (err) throw err;

        var db = client.db('recordings');
        db.collection('flights').find().toArray(function (err, result) {
            if (err) throw err;
            console.log(result);
        })
    });
   return res.json({'a': 3});
}

app.get('/', (req, res) => f(req, res));
// app.get('/', (req, res) => {
//    res.json({'a': 1});
// });

const port = 5000;
app.listen(port, () => console.log('Listening on port ' + port));