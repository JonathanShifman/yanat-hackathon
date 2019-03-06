from pymongo import MongoClient
import json

input_path = 'resources/polygons.json'
with open(input_path, 'r') as input_file:
    polygons = json.loads(input_file.read())['polygons']

client = MongoClient('localhost', 27017)
db = client['recordings']
collection = db['polygons']
for polygon in polygons:
    collection.insert_one(polygon)
