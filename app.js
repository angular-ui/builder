var express = require('express');
var fs = require('fs');

var app = express();

app.configure(function() {
  app.use(express.bodyParser());
});

//CORS
app.all('/ui-mason/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.post("/ui-mason/", function(req, res, next) {
  console.log(req.body);
});

module.exports = app;
