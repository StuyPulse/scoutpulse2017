const express = require('express');
const path = require('path');
const qs = require('querystring');

const app = express();

const SITE_PORT = 5000;
const TEMPLATE_FOLDER = 'templates'
const STATIC_FOLDER = 'static'

app.use(express.static(path.join(__dirname, STATIC_FOLDER)));


app.get('/', function(req, res) {
    res.redirect('/scout');
});

// Display scout page
app.get('/scout', function(req, res) {
    res.sendFile( load_template('scout.html') );
});

// Send scout data
app.post('/scout', function(req, res) {
    console.log("Received data! ");
    get_request_data(req, function(data) {
        console.log(data);
    });
});

// START LISTENING
app.listen(SITE_PORT, function() {
    console.log('Listening on port ' + SITE_PORT);
});


// UTILITY FUNCTIONS (todo: Put in a separate module)

// Loads a template, setting the html page as our current page
function load_template(url) {
    return path.join(__dirname + '/' + TEMPLATE_FOLDER + '/' + url);
}

// Gets the data from a request, passing it through the "on_complete" function
function get_request_data(req, on_complete) {
    let body = '';
    req.on('data', function(chunk) {
        body += chunk;
        if (body.length > 1e6) request.connection.destroy();
    });
    req.on('end', function() {
        var post = qs.parse(body);
        on_complete(post);
    });
}
