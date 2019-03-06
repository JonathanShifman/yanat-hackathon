from math import radians, atan2, pi
from pymongo import MongoClient
from dateutil.parser import parse
from dateutil.tz.tz import _datetime_to_timestamp as timesinceepoch


def parse_recordings(fileName):
	recordings = []
	with open(fileName, 'r') as file:
		first_line = True
		for line in file:
			if first_line:
				first_line = False
				continue
			line = line.rstrip()
			fields = line.split(',')
			flight_id, time, lat, lon, alt, direction = fields[0], fields[5], fields[6], fields[7], fields[9], fields[12]
			has_alt, has_dir = bool(alt), bool(direction)
			if not flight_id or not time or not lat or not lon:
				continue
			try:
				time = int(timesinceepoch(parse(time)) * 1000)
				lat = float(lat)
				lon = float(lon)
				if alt:
					alt = int(alt)
				else:
					alt = None
				if not direction:
					direction = None
			except:
				continue
			recordings.append({'id': flight_id, 'time': time, 'lat': lat, 'lon': lon, 'alt': alt, 'has_alt': has_alt, 'dir': direction, 'has_dir': has_dir})
	process_recordings(recordings)
	return recordings


def process_recordings(recordings):
	flights = {}
	for record in recordings:
		if record['id'] not in flights:
			flights[record['id']] = []
		flights[record['id']].append(record)
	for flight in flights:
		flight_records = sorted(flights[flight], lambda r1, r2: r1['time'] - r2['time'])
		fix_direction(flight_records)
		fix_altitude(flight_records)


def vector_to_dir(v):
	x1 = v[0][0]
	y1 = v[0][1]
	x2 = v[1][0]
	y2 = v[1][1]
	radians = atan2((y1 - y2), (x1 - x2))
	compassReading = radians * (180 / pi)
	coordNames = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest", "North"];
	coordIndex = int(round(compassReading / 45))
	if coordIndex < 0:
		coordIndex = coordIndex + 8
	return coordNames[coordIndex]


def fix_direction(records):
	if len(records) == 1:
		return
	# Fix all directions bit the first:
	for i in range(1, len(records)):
		if not records[i]['dir']:
			records[i]['dir'] = vector_to_dir(((records[i - 1]['lon'], records[i - 1]['lat']), (records[i]['lon'], records[i]['lat'])))
	# Fix first direction:
	if not records[0]['dir']:
		records[0]['dir'] = records[1]['dir']


def fix_altitude(records):
	alts = [record['alt'] for record in records]
	if not any(alts):
		# No altitude for any plot.
		for record in records:
			record['alt'] = 25000
		return
	l = len(alts)
	# Fix initial missing values:
	first_existing_alt_index = 0
	for i in range(l):
		if alts[i]:
			first_existing_alt_index = i
			break
	for i in range(first_existing_alt_index):
		alts[i] = alts[first_existing_alt_index]
	# Fix tailing missing values:
	last_existing_alt_index = 0
	for i in range(l):
		if alts[l - i - 1]:
			last_existing_alt_index = l - i - 1
			break
	for i in range(last_existing_alt_index + 1, l):
		alts[i] = alts[last_existing_alt_index]
	# Fix missing intermediate values:
	last_existing_index = 0
	in_missing_section = False
	for i in range(l):
		if not alts[i]:
			in_missing_section = True
			continue
		if not in_missing_section:
			last_existing_index = i
			continue
		in_missing_section = False
		n = i - last_existing_index - 1
		min_index, max_index = (last_existing_index, i) if alts[last_existing_index] < alts[i] else (i, last_existing_index)
		for j in range(last_existing_index + 1, i):
			alts[j] = int(alts[min_index] + (alts[max_index] - alts[min_index]) * (float(j - last_existing_index) / (n + 1)))
			alts[j] = alts[j] - alts[j] % 100
	for i, record in enumerate(records):
		record['alt'] = alts[i]


if __name__ == '__main__':
	recordings = parse_recordings('xaa.csv')
	client = MongoClient('localhost', 27017)
	db = client.recordings
	db.flights_small.insert_many(recordings)
	client.close()

