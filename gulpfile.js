const gulp = require('gulp');
const ts = require('gulp-typescript');
const sass = require('gulp-sass');
const del = require('del');
sass.compiler = require('node-sass');
nodemon = require('gulp-nodemon');
const tsProject = ts.createProject('tsconfig.prod.json');
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

gulp.task('start:watch', async () => nodemon({
    script: paths.build + '/app.js',
    watch: paths.src,
    ext: 'ts, njk',
    tasks: ['build'],
    env: { 'DEBUG': 'Application,Request,Response' }
}));

gulp.task('copy-views', function () {
    return gulp.src(paths.pages + '/**/*').pipe(gulp.dest(paths.build + '/views'));
});

gulp.task('copy-govukfrontend', function () {
    return gulp.src(paths.govukfrontend + '/**/*').pipe(gulp.dest(paths.build + '/' + paths.govukfrontend));
});

gulp.task('compile-project', function () {
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest(paths.build));
});

gulp.task('copy-descriptors', function () {
    return gulp.src('tsconfig.json').pipe(gulp.dest(paths.build));
});

gulp.task('build', gulp.series('compile-project', gulp.parallel('copy-views', 'copy-govukfrontend', 'copy-descriptors')));

gulp.task('build:clean', gulp.series('clean:build', 'build'));

