const gulp = require('gulp')
const del = require('del')
const runSequence = require('run-sequence')
const sourceMaps = require('gulp-sourcemaps')
const tsc = require('gulp-typescript')
const watch = require('gulp-watch')

/**
* Remove dist directory.
*/
gulp.task('clean', (done) => {
    return del(['dist'], done);
});

/**
* Copy start script.
*/
gulp.task('copy', () => {
    return gulp.src('src/start.js')
        .pipe(gulp.dest('dist'));
});

/**
* Build the server.
*/
gulp.task('build:express', () => {
    const project = tsc.createProject('src/tsconfig.json');
    const result = gulp.src('src/**/*.ts')
        .pipe(sourceMaps.init())
        .pipe(project());
    return result.js
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('dist'));
});

/**
* Build the project.
*/
gulp.task('default', (done) => {
    runSequence('clean', 'copy', 'build:express');
});

gulp.task('watcher', (done) => {
    gulp.watch('src/**/*.ts', ['default']);
})