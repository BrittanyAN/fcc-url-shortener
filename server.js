'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var url = require('url');


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// Connect to DB
// Set up Link Schema to save links to DB
mongoose.connect(process.env.MONGOLAB_URI);

var Schema = mongoose.Schema;
var linkSchema = new Schema({
  original_url: String,
  short_url: Number
});
var Link = mongoose.model('Link', linkSchema);



app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

// Mount body parser
// Can access info later with req.body
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

// URL Shortener Microservice
// Get URL from body
// Check if valid and unique
// Update DB with new link if applicable
// Return JSON response

app.post('/api/shorturl/new', function(req, res) {
  let newurl = url.parse(req.body.url);
  let short;

  dns.lookup(newurl.host, function(err, add) {
    if (err) {
      res.json({error:"invalid URL"});
    } else {
        Link.findOne({original_url: newurl.href}, function(err, data) {
          if (data == null) {
            Link.count({}, function(err, count) {
              short = count + 1;
              Link.create({original_url: newurl.href, short_url: short});
              res.json({original_url: newurl.href, short_url: short});
            });
          } else {
            short = data.short_url;
            res.json({original_url: newurl.href, short_url: short});
          }
        });
    }
  })
  
  
  
});

// When short URL is used
// Find short URL in DB
// Redirect to original URL or display error
app.get('/api/shorturl/:short', function(req, res) {
    let short = req.params.short;
    
    Link.findOne({short_url: short}, function(err, data) {
      if (err || data == null) {
        res.json({error: "invalid URL"});
      } else {
        res.redirect(data.original_url);
      }
    });
    
  })