import React, {Component} from 'react';
import './App.css';
// import 'leaflet/dist/leaflet.css';

class App extends Component {
    constructor() {
        super();
        this.state = {
            timeNavVisible: false,
            L: require('leaflet'),
            axios: require('axios')
        };
    }

    componentDidMount() {
        let L = this.state.L;
        var mymap = L.map('mapid').setView([31.5, 35], 7);
        var markersLayer = L.layerGroup().addTo(mymap);
        this.setState({
           markersLayer: markersLayer
        });
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: 18,
          id: 'mapbox.streets',
          accessToken: 'pk.eyJ1Ijoiam9uYXRoYW5zaGlmbWFuIiwiYSI6ImNqc3dhZmRqMjA0YnQ0NHBpenR1bDZuZW8ifQ.4P8gGbh0nayyfq_jLhnZ7A'
        }).addTo(mymap);
        this.setState({
            map: mymap
        });
    }

    render() {
    return (
        <div id="wrapper">
            <div id="header">
                <div id="polygons-control-panel">
                    <button className={'btn btn-danger btn-sm'}>פוליגון חדש</button>
                </div>
                <div id="time-control-panel">
                    <div className={'time-control-panel-field'}>
                        זמן התחלה:
                        <input type="text" onChange={event => this.updateStartTime(event)}/>
                    </div>
                    <div className={'time-control-panel-field'}>
                        זמן סיום:
                        <input type="text" onChange={event => this.updateEndTime(event)}/>
                    </div>
                    <div className={'time-control-panel-field'}>
                        <button className={'btn btn-primary btn-sm'} onClick={event => this.updateTimeSpan(event)}>עדכן</button>
                    </div>
                    <div className={'time-control-panel-field ' + (this.state.timeNavVisible ? '' : 'invisible')} id="time-navigation">
                        <div className={'time-control-panel-field'}>
                            <button className={'btn btn-success btn-sm'}>&lt;-</button>
                        </div>
                        <div className={'time-control-panel-field'}>
                            1
                        </div>
                        <div className={'time-control-panel-field'}>
                            <button className={'btn btn-success btn-sm'}
                                    onClick={event => this.incrementCurrentTime(event)}>-&gt;</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="mapid"></div>
        </div>
    );
    }

    updateStartTime(event) {
        this.setState({
           startTime: event.target.value.length > 0 ? +event.target.value : null
        });
    }

    updateEndTime(event) {
        this.setState({
            endTime: event.target.value.length > 0 ? +event.target.value : null
        });
    }

    incrementCurrentTime(event) {
        if (this.state.currentTime < this.state.endTime) {
            this.setState({
                currentTime: this.state.currentTime + 1
            }, () => this.updateMarkers() );
        }
    }

    updateTimeSpan() {
        let startTime = this.state.startTime;
        let endTime = this.state.endTime;
        if (startTime == null || isNaN(startTime) || startTime < 0 ||
            endTime == null || isNaN(endTime) || endTime < 0) {
            this.setState({
                timeNavVisible: false
            });
            return;
        }
        this.setState({
            timeNavVisible: true,
            currentTime: startTime
        }, () => this.updateMarkers() );
    }

    updateMarkers() {
        const L = this.state.L;
        const axios = this.state.axios;
        let markersLayer = this.state.markersLayer;
        axios.get('http://68.183.110.169:5000/flights/timespan/' + this.state.currentTime  + '/' + this.state.currentTime)
            .then(response => {
                if (response) {
                    markersLayer.clearLayers();
                    let snapshots = response.data['snapshots'];
                    for (let snapshot of snapshots) {
                        L.marker([snapshot['lat'], snapshot['lon']]).addTo(markersLayer);
                    }
                }
            })
            .catch(error => { console.log(error); });
    }

}

export default App;


