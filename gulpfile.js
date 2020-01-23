const gulp = require('gulp');
const ts = require('gulp-typescript');
const sass = require('gulp-sass');
const del = require('del');
sass.compiler = require('node-sass');
const tsProject = ts.createProject('tsconfig.json');
const paths = {
    build: ['build'],
    pages: ['src/views'],
    public: ['src/public'],
    sassSrc: ['src/public/sass'],
    sassDest: ['src/public/css'],
    nodeModules: ['node_modules'],
    govukfrontend: ['node_modules/govuk-frontend']
};

gulp.task('clean:dist', async function () {
    return del.sync(paths.build);
});

gulp.task('build-sass', function () {
    return gulp.src(paths.sassSrc + '/**/*.scss')
        .pipe(sass({ includePaths: paths.nodeModules }).on('error', sass.logError))
        .pipe(gulp.dest(paths.build + '/public/css'));
});

gulp.task('sass:watch', async function () {
    gulp.watch(paths.sassSrc + '/**/*', gulp.series(['build-sass'])); 
});

gulp.task('copy-views', function () {
    return gulp.src(paths.pages + '/**/*').pipe(gulp.dest(paths.build + '/views'));
});

gulp.task('copy-assets', function () {
    return gulp.src(paths.public + '/**/*').pipe(gulp.dest(paths.build + '/public/'));
});

gulp.task('copy-govukfrontend', function () {
    return gulp.src(paths.govukfrontend + '/**/*').pipe(gulp.dest(paths.build + '/' + paths.govukfrontend));
});

gulp.task('compile-project', function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest('build'));
});

gulp.task('build', gulp.series('compile-project', gulp.parallel('copy-assets', 'copy-views', 'copy-govukfrontend', 'build-sass')));

gulp.task('build:clean', gulp.series('clean:dist', 'build'));

