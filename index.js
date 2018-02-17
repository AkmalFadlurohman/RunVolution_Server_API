// ============================================== Init Library ==============================================
const express       = require('express');
const bodyParser    = require('body-parser');
const CronJob       = require('cron').CronJob;
const fileSystem    = require('fs');
const baseURL       = ' https://runvolution.herokuapp.com/';
const app           = express();
const { Client }    = require('pg');

//client.connect();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static('static'));
app.use('/data', express.static('data'));
app.set('port', (process.env.PORT || 5000));


// =============================================== Access Database ============================================


// ============================================= Request Routing =============================================

app.get('/', function(request, response) {
    response.send('RunVolution GET Handler');
});

app.post('/register', function(request, response) {
    console.log('Get new POST request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));
    
    var email = request.body.email;
    var password = request.body.password;
    var name = request.body.name;
    var def_petname = "Bobby";
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    var petInsertQuery = 'INSERT INTO pet (name,level,xp) VALUES($1,$2,$3) RETURNING id';
    client.connect();
    client.query(petInsertQuery, [def_petname,1,0], function(err, res) {
        if (err) throw err;
        else {
            var maxPetId = res.rows[0].id;
            console.log("Inserted new pet record with id : " + maxPetId);
            var userInsertQuery = 'INSERT INTO "user" (email,password,name,previous_record,current_record,pet_id) VALUES ($1,$2,$3,$4,$5,$6)';
            client.query(userInsertQuery, [email,password,name,0,0,maxPetId], (err, res) => {
                if (err) throw err;
                console.log("Inserted new user record with email : " + email + "and name : " + name);
                client.end();
            });
        }
    });
    response.status(200).send("OK");
});

app.post('/login', function(request, response) {
    console.log('Get new POST request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));

    var email = request.body.email;
    var password = request.body.password;
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    client.connect();
    console.log('Query : SELECT password FROM "user" WHERE email = \'' + email + '\';');
    client.query('SELECT password FROM "user" WHERE email = \'' + email + '\';', function(err, res) {
        if (err) throw err;
        else {
            console.log("Found password : " + JSON.stringify(res.rows.password));
            if (res.rows.password === password) {
                response.status(200).send("OK");
            } else {
                response.status(200).send("Incorrect password or email");
            }
        }
        client.end();
    });
});

app.get('/fetchuser', function(request, response) {
    console.log('Get new GET request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));

    var email = request.param('email');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    client.connect();
    client.query('SELECT * FROM "user" WHERE email = ' + email + ';', function(err, res) {
        if (err) throw err;
        else {
            response.status(200).send(JSON.stringify(res));
        }
        client.end();
    });
});

app.get('/fetchpet', function(request, response) {
    console.log('Get new GET request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));

    var petId = request.param('petid');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    client.connect();
    client.query('SELECT * FROM pet WHERE id = ' + id + ';', function(err, res) {
        if (err) throw err;
        else {
            response.status(200).send(JSON.stringify(res));
        }
        client.end();
    });
});






// ============================================= Start Server =============================================
app.listen(app.get('port'), function() {
    console.log('RunVolution Listening on port :', app.get('port'));
});
