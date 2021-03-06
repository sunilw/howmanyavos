var gulp = require('gulp') ;
var sass = require('gulp-sass') ;
var minifyHTML = require('gulp-minify-html') ;
var watch = require('gulp-watch') ;
var sourcemaps = require('gulp-sourcemaps') ;
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var combiner = require('stream-combiner2');
var reload      = browserSync.reload;

gulp.task('minify-html', function() {    
    var opts = {
	empty: true,
	spare:true
    };
    gulp.src('./src/html/*.html')
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest('./'))
});

gulp.task('watch', function () {
    gulp.watch('./src/html/**.html', ['minify-html']);
    gulp.watch('./src/sass/**.scss', ['sass']);
    gulp.watch('./src/js/**.js', ['scripts']);
    gulp.watch("*.html").on("change", reload);
});

gulp.task( 'sass', function() {
    return gulp.src('./src/sass/**.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./css'))
        .pipe(browserSync.stream()) ;
}) ;

gulp.task('scripts', function() {
    return gulp.src([
	'./src/js/jquery.js',
        './src/js/awesomplete.js',
	'./src/js/house-values.js',
        './src/js/avos.js' ])
        .pipe(concat('avos.js'))
        .pipe(gulp.dest('./js'))
        .pipe(uglify())
        .pipe(rename('avos.min.js'))
        .pipe(gulp.dest('./js')) ;
});

gulp.task('serve', function() {
    browserSync({
        proxy : 'http://howmanyavos.dev',
        open:   false
    });

    gulp.watch("./js/**").on('change', browserSync.reload);

});

gulp.task('default', ['sass', 'scripts','watch', 'serve']) ;
