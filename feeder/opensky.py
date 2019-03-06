import requests
from requests.auth import HTTPDigestAuth
import json
from pymongo import MongoClient
from csv_to_mongo import process_recordings

username = ""
password = ""
default_lamin = 29.028467
default_lomin = 8.768358
default_lamax = 40.657121
default_lomax = 38.830755
base_url_api = "https://opensky-network.org/api/"
track_states_api_path = "states/all"
tracks_api_path = "tracks/all"
ttl = 10
sleep_time = 1


def get_alive_tracks_in_box(lamin, lomin, lamax, lomax):
    params = dict()
    params["lamin"] = lamin
    params["lomin"] = lomin
    params["lamax"] = lamax
    params["lomax"] = lomax
    response = requests.get(
        "https://opensky-network.org/api/states/all?lamin=29.028467&lomin=8.768358&lamax=40.657121&lomax=38.830755")
    if response.ok:
        json_data = json.loads(response.content)
        return json_data
    else:
        # If response code is not ok (200), print the resulting http error code with description
        response.raise_for_status()
        return None


def save_aircraft_to_db(aircraft):
    icao24 = aircraft[0]
    timestamp = aircraft[2]
    params = dict()
    params['icao24'] = icao24
    params['time'] = timestamp
    response = requests.get(base_url_api + tracks_api_path, auth=HTTPDigestAuth(username, password),
                            verify=True, params=params)
    if response.ok:
        json_data = json.loads(response.content)
        track_id = icao24 + str(timestamp)
        track_updates = json_data[u'path']
        flight = []
        for track_update in track_updates:
            if track_update[1] is None or track_update[2] is None:
                continue
            flight.append(
                {'id': track_id, 'time': track_update[0] * 1000, 'lat': track_update[1], 'lon': track_update[2],
                 'alt': track_update[3],
                 'has_alt': track_update[3] is not None, 'dir': None, 'has_dir': False})
        process_recordings(flight)
        client = MongoClient('localhost', 27017)
        db = client.recordings
        db.opensky.insert_many(flight)
        client.close()


def main():
    global username
    global password
    username = raw_input("username: ")
    password = raw_input("password: ")
    tracks_ttl = dict()
    # for aircraft in tracks_ttl:
    #     tracks_ttl[aircraft][0] -= 1
    #     if tracks_ttl[aircraft][0] == 0:
    #         save_aircraft_to_db(aircraft)
    #         del tracks_ttl[aircraft]
    tracks = get_alive_tracks_in_box(default_lamin, default_lomin, default_lamax, default_lomax)
    if tracks is not None:
        for track in tracks[u'states']:
            icao24 = str(track[0])
            if icao24:
                last_update_time = track[4]
                tracks_ttl[icao24] = [icao24, 10, last_update_time]
                save_aircraft_to_db(tracks_ttl[icao24])


if __name__ == "__main__":
    main()
