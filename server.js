'use strict';

require('dotenv').config();


const express = require('express');
const cors = require('cors');
const pg = require('pg');

const {response} = require('express');


//DOTENV (read our enviroment variable)

const PORT = process.env.PORT || 3030;
const client = new pg.Client(process.env.DATABASE_URL)

const app = express();

app.use(cors());

const superagent = require('superagent');

app.get('/', (request, response) => {
    response.status(200).send('you did a great job');
});


app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler)



function locationHandler(req, res) {

    const city = req.query.city;

    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    console.log(url);


    superagent.get(url)
        .then(gdata => {
            const locationData = new City(city, gdata.body);
            res.status(200).json(locationData);
        })
}

function weatherHandler(req, res) {
    // const city = req.query.city;

    let key = process.env.WEATHER_API_KEY;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?&lat=${City.all[0].latitude}&lon=${City.all[0].longitude}&key=${key}`;

    // console.log(url);

    superagent.get(url)
        .then(wdata => {

            let days = wdata.body.data.map(day => {

                return new Weather(day);
            });

            res.status(200).json(days);
        })
}

function trailsHandler(req, res) {


    const key = process.env.TRAIL_API_KEY;
    let url = `https://www.hikingproject.com/data/get-trails?lat=${City.all[0].latitude}&lon=${City.all[0].longitude}&maxDistance=10&key=${key}`;

    console.log(url);

    superagent.get(url)
        .then(tdata => {

            var pos = tdata.body.trails.map(trail => {

                return new Trail(trail);
            })

            res.status(200).json(pos);
        })

}


City.all = [];

function City(name, location) {
    this.search_query = name;
    this.formatted_query = location[0].display_name;
    this.latitude = location[0].lat;
    this.longitude = location[0].lon;
    City.all.push(this);

}


function Weather(day) {

    this.forecast = day.weather.description;
    this.date = day.datetime;
}

function Trail(trail) {

    this.name = trail.name;
    this.location = trail.location;
    this.length = trail.length;
    this.stars = trail.stars;
    this.star_votes = trail.star_votes;
    this.summary = trail.summary;
    this.trail_url = trail.trail_url;
    this.conditions = trail.conditions;
    this.condition_date = trail.condition_date;
    this.condition_time = trail.condition_time;
}


app.get('*', (req, res) => {
    res.status(404).send('Not Found');
});

app.use((error, req, res) => {
    res.status(500).send(error);
});

client.connect()
    .then(() => {

        app.listen(PORT, () => {
            console.log(`listening on port ${PORT}`)
        })
    })