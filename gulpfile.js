var gulp = require('gulp');

var concat = require('gulp-concat');
var compass = require('gulp-compass');
var express = require('express');
var path = require('path');

var app = express();

// Configuration
var PORT = 5000;
var DEST = './public';

var paths = {
  css: './assets/stylesheets/soysauce.scss',

  stylesheets: './assets/stylesheets/soysauce/*.scss',

  scripts: [
    './bower_components/fastclick/lib/fastclick.js',
    './assets/javascript/hammer.js',
    './assets/javascript/legacy-support.js',
    './assets/javascript/images-loaded.js',
    './assets/javascript/soysauce/core.js',
    './assets/javascript/soysauce/utilities/*.js',
    './assets/javascript/soysauce/widgets/*.js'
  ]
};

gulp.task('compass', function() {
  gulp.src(paths.css)
    .pipe(compass({
      config_file: './config.rb',
      css: 'public',
      sass: 'assets/stylesheets'
    }))
    .pipe(gulp.dest(DEST))
});

gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(concat('soysauce.js'))
    .pipe(gulp.dest(DEST));
});

gulp.task('watch', function() {
  gulp.watch(paths.stylesheets, ['compass']);
  gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('express', function() {
  app.use(express.static(__dirname));
  app.listen(PORT);
});

gulp.task('default', ['compass', 'scripts', 'watch', 'express']);
