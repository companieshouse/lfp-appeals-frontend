const gulp = require('gulp');
const ts = require('gulp-typescript');
const sass = require('gulp-sass');
const del = require('del');
sass.compiler = require('node-sass');
nodemon = require('gulp-nodemon');
const tsProject = ts.createProject('tsconfig.json');
const paths = {
    build: ['dist'],
    pages: ['src/views'],
    public: ['src/public'],
    sassSrc: ['src/public/sass'],
    sassDest: ['src/public/css'],
    src: ['src'],
    nodeModules: ['node_modules'],
    govukfrontend: ['node_modules/govuk-frontend']
};

gulp.task('clean:build', async function () {
    return del.sync(paths.build);
});

gulp.task('build-sass', function () {
    return gulp.src(paths.sassSrc + '/**/*.scss')
        .pipe(sass({ includePaths: paths.nodeModules }).on('error', sass.logError))
        .pipe(gulp.dest(paths.build + '/public/css'));
});

gulp.task('start:watch', async () => nodemon({
    script: 'dist/app.js',
    watch: paths.src,
    ext: 'ts, scss, css, njk',
    tasks: ['compile-project', 'copy-assets', 'copy-views', 'build-sass'],
    env: { 'DEBUG': 'Application,Request,Response' }
}));

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
        .js.pipe(gulp.dest('dist'));
});

gulp.task('build', gulp.series('compile-project', gulp.parallel('copy-assets', 'copy-views', 'copy-govukfrontend', 'build-sass')));

gulp.task('build:clean', gulp.series('clean:build', 'build'));

