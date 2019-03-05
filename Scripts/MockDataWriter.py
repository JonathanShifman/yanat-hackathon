from pymongo import MongoClient
import json

input_path = 'resources/mock_flights.json'
with open(input_path, 'r') as input_file:
    snapshots = json.loads(input_file.read())['snapshots']

client = MongoClient('localhost', 27017)
db = client['recordings']
collection = db['mockFlights']
for snapshot in snapshots:
    collection.insert_one(snapshot)
