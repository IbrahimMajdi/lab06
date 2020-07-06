'use strict';

const express = require('express');

//CORS = Cross Origin Resource Sharing
const cors = require('cors');

//DOTENV (read our enviroment variable)
require('dotenv').config();

const PORT = process.env.PORT || 3030;

const app = express();

app.use(cors());

app.get('/', (request, response) => {
    response.status(200).send('you did a great job');
});

app.get('/location', (req, res) => {
    const city = req.query.city;
    const locationsData = require('./data/location.json');
    const cityRequest = new City(city, locationsData);
    res.send(cityRequest);
});

app.get('/weather', (req, res) => {
    const weatherData = require('./data/weather.json');
    const weatherRequest = new Weather(weatherData.data);
    res.send(weatherRequest);
});


function City(name, location) {
    this.search_query = name;
    this.formatted_query = location[0].display_name;
    this.latitude = location[0].lat;
    this.longitude = location[0].lon;

}


function Weather(data) {

    console.log(data.length);
    
    //    datas.forEach(function (element) {
    for (let i = 0; i < data.length; i++) {

        this.forecast = data[i].weather.description;
        this.date = data[i].valid_date;
    }

    // });

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