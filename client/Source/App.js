/**
 * Will draw entities over the cesium viewer of the type:
 *
 * Flight ID:
 * Time:
 * Long:
 * Lat:
 */

let example = {
    'FlightID': "AAR551-1419920966-airline-0179:0",
    'Time(UTC)': "01/01/2015 13:01:00",
    'Latitude:': 40.976892,
    'Longtitude': 28.821111
};

const BASE_URL = "http://68.183.110.169:5000/flights/time/";
const TIME_THRESHOLD = 0.001;
// Threshold to send a request to the server.
const SENDING_THRESHOLD = 1000;

// Collection of all drawn cesium entities and their time. Lets us track the current entities that are drawn.
let drawnEntities = {};

function getUrlVars() {
    let vars = {};
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

function unixTimeToJulianDate(time) {
    // Create a new JavaScript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    let date = new Date(time*1000);
    // Hours part from the timestamp
    let hours = date.getHours();
    // Minutes part from the timestamp
    let minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    let seconds = "0" + date.getSeconds();

    // Will display time in 10:30:23 format
    let formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    console.log(formattedTime);
    // let jd = time/86400000 + 2440587.5;
    // return new Cesium.JulianDate()
    return Cesium.JulianDate.fromDate(date);
}


/**
 * Instantiate our clock model, the user will set a given time that will
 * be sent to the server which will return the entities close to that
 * time (up to a given threshold).
 */
let variables = getUrlVars();
let startTime = unixTimeToJulianDate(getUrlVars()["start"]);
let endTime = unixTimeToJulianDate(getUrlVars()["end"]);

let clock = new Cesium.Clock();
clock.startTime = startTime;
clock.endTime = endTime;
clock.currentTime = startTime;
clock.multiplier = 0; // Don't start animation by default
clock.clockRange = Cesium.ClockRange.CLAMPED;
clock.clockStep = Cesium.ClockStep.TICK_DEPENDENT;
clock.shouldAnimate = true;
clock.canAnimate = true;

let cesiumWidget = new Cesium.Viewer('cesiumContainer', {
    clock: clock
});

const lastTime = new Date(0);
let fakeTime = 1;

Cesium.JulianDate.clone(clock.currentTime, lastTime);
cesiumWidget.clock.onTick.addEventListener(function(clock) {
    // This is rendered every time.
    if (Math.abs(Cesium.JulianDate.compare(clock.currentTime, lastTime)) > TIME_THRESHOLD) {
        let currentTime = Cesium.JulianDate.toDate(clock.currentTime).getTime();
        const lastTimeMS = Cesium.JulianDate.toDate(lastTime).getTime();
        console.log("Changed via slider.");

        // Cesiun.JulianTime.toDate(lastTime).getTime()
        if (Math.abs(currentTime - lastTimeMS) > SENDING_THRESHOLD) {
            cesiumWidget.entities.removeAll();
            requestEntitiesAtTime(currentTime);
            fakeTime += 1;
            console.log("Fake time: " + fakeTime);

            // Save current time as last time.
            Cesium.JulianDate.clone(clock.currentTime, lastTime);
            }
        }
});

/**
 * Draw the planes.
 * Receives a list of snapshots.
 */
function drawEntities(snapshots) {
    for (let snapshot of snapshots) {
        let currentEntity = {
            position: Cesium.Cartesian3.fromDegrees(snapshot.lon, snapshot.lat, 1000),
            ellipsoid : {
                radii : new Cesium.Cartesian3(2000.0, 2000.0, 3000.0),
                material : Cesium.Color.BLUE
            },
            description: "<p><div>FlightId: " + snapshot.id + "</div>" +
                "<div> Time:" + new Date(snapshot.time).toString() + "</div></p>"
        };
        // drawnEntities[snapshot._id] = {time: fakeTime,entity: currentEntity};
        // cesiumWidget.entities.add(currentEntity);
        cesiumWidget.entities.add(currentEntity);
    }
}

// Base config that will be used for axios.
const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { 'content-type': 'application/x-www-form-urlencoded' }
});

/**
 * Request the entities from the server at a given time.
 * @param time Time of the request, in milliseconds.
 */
function requestEntitiesAtTime(time, sign) {
    // We go forward in time, request entities from server.
    time = fakeTime;
    instance.get('/' + time, {crossdomain: true}).then(function (response) {
        let data = response.data["snapshots"];
        let plane_id_to_positions = {};


        for (let snapshot of data) {
            if (snapshot) {
                if (!(snapshot.id in plane_id_to_positions)) {
                    plane_id_to_positions[snapshot.id] = []
                }

                plane_id_to_positions[snapshot.id].push(snapshot);
            }
        }

        for (let id of Object.keys(plane_id_to_positions)) {
            drawEntities(plane_id_to_positions[id]);
        }

        // cesiumWidget.zoomTo(cesiumWidget.entities);


        console.log(plane_id_to_positions);
    });

}




// });
// axios.get('/getAirport?ICAO=SAEZ').then(function(response) {
//     data = response.data;
//     cesiumWidget.entities.add({
//         position: Cesium.Cartesian3.fromDegrees(parseFloat(data.Lon), parseFloat(data.Lat)),
//         ellipse : {
//             semiMinorAxis : 250000.0,
//             semiMajorAxis : 400000.0,
//             material : Cesium.Color.BLUE.withAlpha(0.5)
//         }
//     });
//     console.log(response);
//     cesiumWidget.zoomTo(cesiumWidget.entities);
// });
//
//
