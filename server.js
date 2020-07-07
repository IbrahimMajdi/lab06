'use strict';

const express = require('express');

//CORS = Cross Origin Resource Sharing
const cors = require('cors');

//DOTENV (read our enviroment variable)
require('dotenv').config();

const PORT = process.env.PORT || 3030;

const app = express();

app.use(cors());

const superagent = require('superagent');

app.get('/', (request, response) => {
    response.status(200).send('you did a great job');
});


app.get('/location', locationHandler);
app.get('/weather', weatherHandler);



function weatherHandler(req, res) {

    const city = req.query.city;

    let key = process.env.WEATHER_API_KEY;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;

    // console.log(url);

    superagent.get(url)
        .then(wdata => {

            let days = wdata.body.data.map(day => {
                
                return new Weather(day);
            });

            res.status(200).json(days);
        })
}

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



function City(name, location) {
    this.search_query = name;
    this.formatted_query = location[0].display_name;
    this.latitude = location[0].lat;
    this.longitude = location[0].lon;

}


function Weather(day) {

    this.forecast = day.weather.description;
    this.date = day.datetime;
}


app.get('*', (req, res) => {
    res.status(404).send('Not Found');
});

app.use((error, req, res) => {
    res.status(500).send(error);
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})