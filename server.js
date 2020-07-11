'use strict';

require('dotenv').config();


const express = require('express');
const {
    response
} = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');


const app = express();
app.use(cors());

const PORT = process.env.PORT || 3030;
const client = new pg.Client(process.env.DATABASE_URL)


app.get('/', (request, response) => {
    response.status(200).send('you did a great job');
});


app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.get('/movies', moviesHandler);



function locationHandler(req, res) {

    const city = req.query.city;

    getlocation(city).then(locationData => {
        res.status(200).json(locationData);
    })
}

function getlocation(city) {

    let SQL = `SELECT * FROM locations WHERE search_query=$1;`;
    let values = [city];

    return client.query(SQL, values).then(result => {

        if (result.rowCount) {

            console.log('already exists');

            return result.rows[0];

        } else {

            let key = process.env.GEOCODE_API_KEY;
            let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

            return superagent.get(url)
                .then(gdata => {
                    const locationData = new City(city, gdata.body);

                    let SQL = `INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4);`;
                    let safeValues = [city, locationData.formatted_query, locationData.latitude, locationData.longitude];

                    return client.query(SQL, safeValues).then(result => {

                        return result.rows[0];
                    })
                })


        }

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



function moviesHandler(req, res) {

    const key = process.env.MDB_KEY;
    let url = `https://api.themoviedb.org/3/discover/movie?api_key=${key}&sort_by=popularity.desc&region=${Weather.all.country_code}&page=1`;

    superagent.get(url)
        .then(mdata => {

            var movie = mdata.body.results.map(movie => {

                return new Movies(movie);
            })

            res.status(200).json(movie);
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

Weather.all=[];

function Weather(day) {

    this.forecast = day.weather.description;
    this.date = day.datetime;
    Weather.all.push(this);
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

function Movies(movie) {

    this.title = movie.title;
    this.overview = movie.overview;
    this.average_votes = movie.vote_average;
    this.total_votes = movie.vote_count;
    this.image_url = movie.poster_path;
    this.popularity = movie.popularity;
    this.released_on = movie.release_date;

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