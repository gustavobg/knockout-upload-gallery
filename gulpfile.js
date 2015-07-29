var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');


gulp.task('default', function() {
    // place code for your default task here
});

// Static server
gulp.task('serve', ['sass'], function() {
    browserSync.init({
        server: {
            baseDir: "./src"
        }
    });

    gulp.watch("src/styles/*.scss", ['sass']);
    gulp.watch("src/*.html").on('change', browserSync.reload);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src("src/styles/*.scss")
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest("src/styles"))
        .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);