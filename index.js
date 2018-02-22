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
            if (res.rows[0] != null && typeof(res.rows[0].password != 'undefined')) {
                console.log("Found password : " + JSON.stringify(res.rows[0].password));
                if (res.rows[0].password === password) {
                    console.log('Succesfully logged in user with email : ' + email);
                    response.status(200).send("OK");
                } else {
                    response.status(200).send("Incorrect password or email");
                }
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
    console.log('Query : SELECT * FROM "user" WHERE email = \'' + email + '\';');
    client.query('SELECT * FROM "user" WHERE email = \'' + email + '\';', function(err, res) {
        if (err) throw err;
        else {
            console.log("Found user data : " + JSON.stringify(res.rows[0]));
            response.status(200).send(JSON.stringify(res.rows[0]));
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
    console.log('Query : SELECT * FROM pet WHERE id = \'' + petId + '\';');
    client.query('SELECT * FROM pet WHERE id = \'' + petId + '\';', function(err, res) {
        if (err) throw err;
        else {
            console.log("Found pet data : " + JSON.stringify(res.rows[0]));
            response.status(200).send(JSON.stringify(res.rows[0]));
        }
        client.end();
    });
});

app.patch('/updaterecord', function(request, response) {
    console.log('Get new PATCH request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));

    var email = request.param('email');
    var record = request.param('record');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    client.connect();

    console.log('Query : SELECT current_record FROM "user" WHERE email = \'' + email + '\';');
    client.query('SELECT current_record FROM "user" WHERE email = \'' + email + '\';', function(err, res) {
        if (err) throw err;
        else {
            var prev_record = res.rows[0].current_record;
            console.log('Query : UPDATE "user" SET previous_record = '+prev_record+',current_record = '+record+' WHERE email = \'' + email + '\';');
            client.query('UPDATE "user" SET previous_record = '+prev_record+',current_record = '+record+' WHERE email = \'' + email + '\';', function(err, res) {
                if (err) throw err;
                else {
                    console.log("Updated user record data with result object : " + JSON.stringify(res));
                    response.status(200).send("OK");
                }
                client.end();
            });
        }
    });
    
    
});

app.patch('/updatepetname', function(request, response) {
    console.log('Get new PATCH request from ' + request.originalUrl + ' with type ' + request.get('content-type'));
    console.log('\t' + JSON.stringify(request.body));

    var petId = request.param('petid');
    var newName = request.param('name');
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    });
    client.connect();

    console.log('Query : UPDATE pet SET name = \''+newName+' \' WHERE id = \'' + petId + '\';');
    client.query('UPDATE pet SET name = '+newName+' WHERE id = \'' + petId + '\';', function(err, res) {
        if (err) throw err;
        else {
            console.log("Updated pet name with result object : " + JSON.stringify(res));
            response.status(200).send("OK");
        }
        client.end();
    });
});







// ============================================= Start Server =============================================
app.listen(app.get('port'), function() {
    console.log('RunVolution Listening on port :', app.get('port'));
});
