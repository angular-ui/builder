var express = require('express');
var fs = require('fs');
var child = require('child_process');

var app = express();

app.use(express.bodyParser());
app.use(express.logger());
app.use(express.static(__dirname + "/bootstrap/dist"));

//CORS
app.all('/ui-mason/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

//Build Bootstrap
app.get("/ui-mason/bootstrap", function(req, res, next) {
  res.json({modules: fs.readdirSync('bootstrap/src/')});
});
//TODO: get the build back as a string from grunt and zip on the fly
app.post("/ui-mason/bootstrap", function(req, res, next) {
  if (req.body && !Array.isArray(req.body.modules)) {
    res.send(400, "Data must be in format '{modules: [arrayOfNames]}'");
  } else {
    var moduleStr = req.body.modules.join(':')
    var grunt = child.spawn('grunt', [
      '--config=./bootstrap/grunt.js',
      'dist:../dist',
      'build:' + moduleStr
    ]);
    grunt.on('stderr', function(data) {
      res.send(500, "Grunt build failed. Error: " + data.toString());
    });
    grunt.on('exit', function(code) {
      if (!code) {
        var files = fs.readdirSync('dist').map(function(f) {
          return "dist/" + f;
        }).filter(function(f) {
          return fs.statSync(f).isFile();
        });
        var zip = child.spawn('zip', ['build.zip'].concat(files));
        zip.on('exit', function(code) {
          if (!code) {
            res.send(200,'/ui-mason/bootstrap/download');
          } else {
            res.send(500, "Failed to zip files");
          }
        });
        zip.stderr.on('data', function(d) { console.log(d.toString()); });
        zip.stdout.on('data', function(d) { console.log(d.toString()); });
      }
    });
  }
});
app.get("/ui-mason/bootstrap/download", function(req, res, next) {
  res.download('build.zip');
});

module.exports = app;
