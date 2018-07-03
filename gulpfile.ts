const gulp = require('gulp')
const del = require('del')
const runSequence = require('run-sequence')
const sourceMaps = require('gulp-sourcemaps')
const ts = require('gulp-typescript')
const watch = require('gulp-watch')

const project = ts.createProject('src/tsconfig.json');

/**
* Remove dist directory.
*/
gulp.task('clean', (done) => {
    return del(['dist'], done);
});

/**
* Build the server.
*/
gulp.task('build', () => {
    return gulp.src('src/**/*.ts')
        .pipe(sourceMaps.init())
        .pipe(project())
    // return result.js
        .pipe(sourceMaps.write())
        .pipe(gulp.dest('dist'));
});

/**
* Build the project.
*/
gulp.task('default', () => {
    // runSequence('clean', 'copy', 'build');
    runSequence('clean', 'build');
});

gulp.task('watch', ['default'], () => {
    gulp.watch('src/**/*.ts', ['default']);
})