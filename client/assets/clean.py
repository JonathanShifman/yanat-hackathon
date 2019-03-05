import csv;
import json;

airports = open("my_airports.csv", 'r')
reader = csv.DictReader( airports, fieldnames = ( "ID","Airport","City","Country","IATA","ICAO","Lat","Lon","Alt","D1","D2","D3","D4","D5"))  
# Parse the CSV into JSON  
# Clean the json file, we want IATA, ICAO, Lat Lon
cleaned = []
for row in reader:
	current = {}
	current["IATA"] = row["IATA"]
	current["ICAO"] = row["ICAO"]
	current["Lat"] = row["Lat"]
	current["Lon"] = row["Lon"]
	current["Alt"] = row["Alt"]
	cleaned.append(current)

out = json.dumps( cleaned )  
print("JSON parsed!")  
# Save the JSON  
f = open( 'airports.json', 'w')  
f.write(out)  
print("JSON saved!") 