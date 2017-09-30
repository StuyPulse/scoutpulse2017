const express = require('express');
const url = require('url');
const path = require('path');
const qs = require('querystring');
const mysql = require('mysql');

const app = express();

const SITE_PORT = 5000;
const TEMPLATE_FOLDER = 'templates'
const STATIC_FOLDER = 'static'

app.use(express.static(path.join(__dirname, STATIC_FOLDER)));


const sql = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "securityFTW", // Obviously insecure. Only use this for testing
    database: "db"// Database must be created first, otherwise this will crash 
});

sql.connect(function(err) {
    if (err) throw err;
    console.log("Connected to MySQL!");
 
    sql.query('CREATE DATABASE IF NOT EXISTS db', function(err, result) {
        if (err) throw err;
        console.log("SQL Database created/checked");
    });

    // Match table
    sql.query('CREATE TABLE IF NOT EXISTS matches ('
                // id and main tag labels
                + 'id INT PRIMARY KEY AUTO_INCREMENT,'
                + 'author VARCHAR(50),'
                + 'match_number VARCHAR(10),'
                + 'team_number SMALLINT,'
                // params
                + 'cross_green_line BOOLEAN,'
                + 'gear_score enum(\'YES\', \'NO\', \'TRIED\'),'
                + 'gear_routine enum(\'HP\', \'CENTER\', \'BOILER\', \'NONE\'),'
                + 'fuel_auton TINYINT UNSIGNED,'
                + 'hoppers TINYINT UNSIGNED,'
                + 'gears_scored TINYINT UNSIGNED,'
                + 'gears_dropped TINYINT UNSIGNED,'
                + 'fuel_teleop TINYINT UNSIGNED,'
                + 'climb BOOLEAN,'
                + 'yellow_card BOOLEAN,'
                + 'comments TEXT'
                + ')'
            , function(err, result) {
        if (err) throw err;
    });

    // Team data table
    sql.query('CREATE TABLE IF NOT EXISTS teams (team_number SMALLINT PRIMARY KEY)', function(err, result) {if (err) throw err;});
});

app.get('/', function(req, res) {
    res.redirect('/scout');
});

// Display scout page
app.get('/scout', function(req, res) {
    res.sendFile( load_template('scout.html') );
});

app.get('/data', function(req, res) {
    res.sendFile( load_template('getdata.html') );
});

// Update scout data
app.post('/scout', function(req, res) {
    get_request_data(req, function(data) {
        console.log(data);

        //sql.query('SELECT 1 FROM matches m WHERE m.match_number=\'' + data.match_number + '\' AND m.team_number=\'' + data.team_number + '\'', function(err, result, fields) {
        sql.query('SELECT 1 FROM matches m WHERE m.match_number=? AND m.team_number=?', [data.match_number, data.team_number] , function(err, result, fields) {
            if (err) throw err;
            if (result.length == 0) {
                //if (result) <--?
                sql_fast_insert('matches', data);
            } else {
                // TODO: Make this sql injection proof
                sql_fast_update('matches', data, 'match_number=\'' + data.match_number + '\' AND team_number=\'' + data.team_number + '\'');
            }
        });

        res.send({result: "success"});
        /*sql.query('INSERT INTO matches (author, match_number, team_number, cross_green_line, gear_score, gear_routine, fuel_auton, hoppers, gears_scored, gears_dropped, fuel_teleop, climb, yellow_card, comments)'
               + 'VALUES (' + data["author"] +','+ data["match_number"] +','+ data["team_number"] +','+ data["cross_green_line"] +','+ data["gear_score"] +','+ data["gear_routine"] +','+ data["fuel_auton"] +','+ data["hoppers"] +','+ data["gears_scored"] +','+ data["gears_dropped"] +','+ data["fuel_teleop"] +','+ data["climb"] +',' + data["yellow_card"] +','+ data["comments"] +')';
                //+ 'WHERE NOT EXISTS (SELECT match_number FROM matches m WHERE m.match_number=' + data["match_number"] + ')';
        */
    });
});

// Gets match data for particular match for particular team
app.get('/getdata', function(req, res) {
    var parts = url.parse(req.url, true);
    var data = parts.query;
    var match_number = data['match_number'];
    var team_number = data['team_number'];

    var queryExtraList = [];

    // Add our specifications to our query definier thing
    // if they exist of course
    if (match_number != null && (match_number !== "")) {
        queryExtraList.push("m.match_number=" + sql.escape(match_number));
    }
    if (team_number != null && (team_number !== "")) {
        queryExtraList.push("m.team_number=" + sql.escape(team_number));
    }

    // What to add to our sql check to specify our search
    var queryExtra = "";
    if (queryExtraList.length != 0) queryExtra = "WHERE ";
    queryExtra += queryExtraList.join(" AND ");

    // Yes, I know *wildcards* is bad practice. It's prototyping
    //sql.query('SELECT * FROM matches m WHERE m.match_number=\'' + match_number + '\' AND m.team_number=\'' + team_number + '\'', function(err, result, fields) {
    sql.query('SELECT * FROM matches m ' + queryExtra, function(err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});


// START LISTENING
app.listen(SITE_PORT, function() {
    console.log('Listening on port ' + SITE_PORT);
});


/// UTILITY FUNCTIONS (todo: Put in a separate module)

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

// Deletes all data in a table. Obviously, be very careful with this
function sql_delete_all(table) {
    sql.query('DELETE FROM ?', table);
}

// Fast inserts data into an SQL table, creating a new row.
function sql_fast_insert(table, data) {
    var insert_titles = '(' + Object.keys(data).join(',') + ')';
    // Gotta include quotes
    var values = Object.keys(data).map((k) => sql.escape(data[k]));
    var value_titles = '(' + values.join(',') + ')';

    console.log('insert into matches ' + insert_titles + ' VALUES ' + value_titles);

    //sql.query('INSERT INTO ' + table + ' ' + insert_titles + ' VALUES ' + value_titles, function(err, result) {
    sql.query('INSERT INTO matches ' + insert_titles + ' VALUES ' + value_titles, function(err, result) {
        if (err) throw err;   
    });
}

// Fast updates data from an SQL table
function sql_fast_update(table, data, where_conditional) {
    var setters = '';
    for(var i = 0; i < Object.keys(data).length; i++) {
        var key = Object.keys(data)[i];
        var value = data[key];
        setters += key + "=" + sql.escape(value);
        if (i < Object.keys(data).length - 1) {
            setters += ',';
        }
        setters += ' ';
    }

    console.log("SETTERS: " + setters);

    //sql.query('UPDATE ' + table + ' SET ' + setters + ' ' + where_conditional, function(err, result) {
    sql.query('UPDATE matches SET ' + setters + ' WHERE ' + where_conditional,/* table,*/ function(err, result) {
        if (err) throw err;
    });
}
