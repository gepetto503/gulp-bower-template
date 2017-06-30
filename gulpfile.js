var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var concat = require("gulp-concat");
var uglify =require("gulp-uglify");
var utilities = require("gulp-util");
var del = require("del");
var jshint = require("gulp-jshint");
var buildProduction = utilities.env.production;

var lib = require('bower-files')({
  "overrides":{
    "bootstrap" : {
      "main": [
        "less/bootstrap.less",
        "dist/css/bootstrap.css",
        "dist/js/bootstrap.js"
      ]
    }
  }
});
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');

gulp.task("jshint", function(){
  return gulp.src(['./js/*.js'])
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

gulp.task("concatInterface", function(){
  return gulp.src(['./js/*-interface.js'])
  .pipe(concat('allConcat.js'))
  .pipe(gulp.dest('./temp'));
});

gulp.task("jsBrowserify", ['concatInterface'], function(){
  return browserify({entries: ['./temp/allConcat.js']})
  .bundle()
  .pipe(source('app.js'))
  .pipe(gulp.dest('./build/js'));
});

gulp.task("minifyScripts", ["jsBrowserify"], function(){
  return gulp.src("./build/js/app.js")
  .pipe(uglify())
  .pipe(gulp.dest("./build/js"));
});

//
gulp.task('bowerJS', function () {
  return gulp.src(lib.ext('js').files)
    .pipe(concat('vendor.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./build/js'));
});

gulp.task('bowerCSS', function () {
  return gulp.src(lib.ext('css').files)
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('./build/css'));
});

gulp.task('bower', ['bowerJS', 'bowerCSS']);

gulp.task("clean", function(){
  return del(['build', 'temp'])
});

gulp.task("build", ['clean'], function(){
  if (buildProduction){
    gulp.start("minifyScripts");
  }else{
    gulp.start("jsBrowserify");
  }
  gulp.start('bower');
  gulp.start('cssBuild');
});

//start local server with Browser Sync
gulp.task('serve', function() {
  browserSync.init({
    server: {
      baseDir: "./",
      index: "index.html"
    }
  });

  //watch list:
  gulp.watch(['js/*.js'], ['jsBuild']);//Watch all of the files inside of our development js folder and whenever one of the files changes, run the task jsBuild
  gulp.watch(['bower.json'], ['bowerBuild']);//Watch the Bower manifest file for changes so that whenever we install or uninstall a frontend dependency our vendor files will be rebuilt and the browser reloaded with the bowerBuild task.
  gulp.watch(['*.html'], ['htmlBuild']);
  gulp.watch("scss/**/*.scss", ['cssBuild']);//watch all files and folders inside scss dir.
});


gulp.task('jsBuild', ['jsBrowserify', 'jshint'], function(){
  browserSync.reload();
});

//rebuild vendor files and reload the browser
gulp.task('bowerBuild', ['bower'], function(){
  browserSync.reload();
});

//html build: reload browser anytime html files change
gulp.task('htmlBuild', function() {
  browserSync.reload();
});

gulp.task('cssBuild', function() {
  return gulp.src('scss/**/*.scss')//look at all folders and files in scss, then build from them.
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./build/css'))
    .pipe(browserSync.stream());
});
