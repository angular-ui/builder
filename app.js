var express = require('express');
var fs = require('fs');
var child_process = require('child_process');
var Q = require('q');

// String.format: simple string formatter for prettiness and fun
// eg "a $0 string tastes like $1".format('cool','pizza') --> "an cool string tastes like pizza"
String.prototype.format = function() {
  var args = Array.prototype.slice.call(arguments);
  return args.reduce(function(prev, current, index) {
    return prev.replace('$'+index, current);
  }, this);
};

var app = express();

app.use(express.bodyParser());
app.use(express.logger());
app.use(express['static']("$0/bootstrap/dist".format(__dirname)));

function build(repo, modules) {
  //sort so modules are always in same order
  var modulesStr = modules.sort().join('-');
  var builddir = 'dist-$0/$1'.format(repo, modulesStr);
  var buildArchive = '$0/build.zip'.format(builddir);
  function grunt() {
    var deferred = Q.defer();
    var child = child_process.spawn('grunt', [
      '--config=$0/grunt.js'.format(repo),
      'dist:../$0'.format(builddir),
      'build:$0'.format(modules.join(':'))
    ]);
    child.stderr.on('data', function(data) {
      console.log(data);
      deferred.reject(data.toString());
    });
    child.stdout.on('data',function(d){console.log(d.toString());});
    child.on('exit', function(code, signal) {
      if (!code) { deferred.resolve(); }
    });
    return deferred.promise;
  }
  function zip() {
    var deferred = Q.defer();
    var files = fs.readdirSync(builddir).map(function(file) {
      return '$0/$1'.format(builddir, file);
    });
    console.log(files);
    var child = child_process.spawn('zip', [
      '--no-dir-entries', buildArchive
    ].concat(files));
    child.stderr.on('data', function(d) {
      console.log(d.toString());
      deferred.reject(d.toString());
    });
    child.stdout.on('data',function(d){console.log(d.toString());});
    child.on('exit', function(code) {
      console.log('exiting', code);
      if (!code) { deferred.resolve(buildArchive); }
    });
    return deferred.promise;
  }

  if (fs.existsSync(builddir)) {
    return Q.fcall(function() { return buildArchive; });
  }
  console.log('grunting');
  return grunt().then(zip);
}

//CORS
app.all('/ui-mason/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

//Get bootstrap modules
app.get("/ui-mason/bootstrap", function(req, res, next) {
  res.json({ modules: fs.readdirSync('bootstrap/src/') });
});
//Get angular-ui modules
app.get('/ui-mason/angular-ui', function(req, res, next) {
  var modules = [];
  var baseDir = 'angular-ui/modules';
  fs.readdirSync(baseDir).forEach(function(dir) {
    fs.readdirSync('$0/$1'.format(baseDir, dir)).forEach(function(moduleName) {
      modules.push(moduleName);
    });
  });
  res.json({ modules: modules });
});

app.post("/ui-mason/:repo", function(req, res, next) {
  if (req.params.repo != 'angular-ui' && req.params.repo != 'bootstrap') {
    res.send(400, 'Request must be for bootstrap or angular-ui repo');
  } else if (req.body && !Array.isArray(req.body.modules)) {
    res.send(400, "Data must be in format '{modules: [arrayOfNames]}'");
  } else {
    build(req.params.repo, req.body.modules).then(function(buildArchive) {
      //Send back the full url including hostname to download the zip at
      res.send(200, '$0/ui-mason/$1/download/$2'
        .format(req.headers.host, req.params.repo, buildArchive));
    }, function(err) {
      res.send(500, err);
    });
  }
});
app.get("/ui-mason/:repo/download/:zip", function(req, res, next) {
  if (fs.existsSync(req.params.zip)) {
    res.download(req.params.zip, 'ui-$0-custom.zip'.format(req.params.repo));
  } else {
    res.send(400, "Given download path does not exist");
  }
});

module.exports = app;
