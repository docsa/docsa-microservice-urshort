'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const dns = require('dns');




var cors = require('cors');

var app = express();

function hash(str) {
  var len = str.length;
  let hash = 5381;
  for (var idx = 0; idx < len; ++idx) {
    hash = 33 * hash + str.charCodeAt(idx);
  }
  return hash;
}

// Basic Configuration 
var port = process.env.PORT || 3000

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);
var Schema=mongoose.Schema;

const shortUrlSchema = new Schema({
    originalUrl: { type: String, required: true },
  });

var ShortUrl= mongoose.model("ShortUrl", shortUrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use("/", bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
  
});

app.post("/api/shorturl/new", function (req,res) {
  
   if(mongoose.connection.readyState!==1) {
    res.json({error:"database not connected"})
  }
  
  let originalUrl = req.body.url;

  
  dns.lookup(originalUrl, function (err, addresses) {
    if(err) {
      res.json({"error":"invalid URL"})
    } else {
        let document = new ShortUrl({originalUrl:originalUrl})
        document.save(function (err, data) {
          if (err) {
            res.json({"error": err.message});
          }
          res.json({"original_url":originalUrl,"short_url":data._id});
        });
    }
  });


  
});

app.get("/api/shorturl/:url", function (req, res) {
  
  if(mongoose.connection.readyState!==1) {
    res.json({error:"database not connected"})
  }
  
  if (!req.params.url.match(/^[0-9a-fA-F]{24}$/)) {
    res.json({error:"invalid short url"})
  }
  
  console.log("short", req.params.url);
  
  let document = ShortUrl.findById(req.params.url, function(err, data) {
    if(err) {
      res.json({"error":err.message})
    } else if (data) {
      res.redirect("http://"+data.originalUrl)
    } else {
      res.json({error:"unknown short url"})
    }
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});