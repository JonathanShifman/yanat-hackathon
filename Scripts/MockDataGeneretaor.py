import json
import random
import math
import matplotlib.pyplot as plt


def generate_snapshots(num_of_flights, bounds, velocity):
    snapshots = []
    for flight_id in range(num_of_flights):
        lons = []
        lats = []
        start_bound_dir = random.randint(0, 3)
        start_bound = bounds[start_bound_dir]

        angle_bounds = [
            [0, math.pi],
            [math.pi, math.pi * 2],
            [-math.pi / 2, math.pi / 2],
            [math.pi / 2, 3 * math.pi / 2],
        ]
        angle_bound = angle_bounds[start_bound_dir]
        angle = random.uniform(angle_bound[0], angle_bound[1])
        lon_step = velocity * math.cos(angle)
        lat_step = velocity * math.sin(angle)

        position = [0, 0]
        time = 0
        if start_bound_dir < 2:
            position[0] = random.uniform(min_lon, max_lon)
            position[1] = bounds[start_bound_dir]
        else:
            position[0] = bounds[start_bound_dir]
            position[1] = random.uniform(min_lat, max_lat)
        while min_lon <= position[0] <= max_lon and min_lat <= position[1] <= max_lat:
            lons.append(position[0])
            lats.append(position[1])
            plt.plot(lons, lats)
            position[0] += lon_step
            position[1] += lat_step
            time += 1
            snapshots.append({
                'id': flight_id,
                'time': time,
                'lon': position[0],
                'lat': position[1]
            })

    plt.show()
    return snapshots


output_path = 'output/mock_flights.json'
num_of_flights = 10
min_lat = 32
max_lat = 34
min_lon = 33
max_lon = 35
velocity = 0.05

snapshots = generate_snapshots(num_of_flights, [min_lat, max_lat, min_lon, max_lon], velocity)
with open(output_path, 'w') as output_file:
    output_file.write(json.dumps({'snapshots': snapshots}))
