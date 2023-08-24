'use strict';

const gulp = require("gulp");
// const ts = require('gulp-typescript');
const browserify = require("browserify");
const buffer = require("vinyl-buffer");
const source = require("vinyl-source-stream");
const uglify = require("gulp-uglify");
const sourcemaps = require("gulp-sourcemaps");
const tsify = require("tsify");
const babelify = require("babelify");

// const tsProject = ts.createProject('tsconfig.json');

function bundle() {
    return browserify({
        basedir: ".",
        debug: true,
        entries: [
            "src/bot.ts"
        ],
        cache: {},
        packageCache: {}
    })
    .plugin(tsify)
    .transform(babelify.configure({
        plugins: ["@babel/plugin-transform-runtime"],
        presets: ["@babel/preset-env"],
        extensions: ['.js', '.ts']
    }))
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    // .pipe(tsProject())
    .pipe(uglify({ mangle: false }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
}

gulp.task("default", bundle);