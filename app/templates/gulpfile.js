// generated on <%= date %> using <%= name %> <%= version %>
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var dev = true;

gulp.task('views', () => {
  return gulp.src('app/*.pug')
    .pipe($.plumber())
    .pipe($.pug({pretty: true}))
    .pipe(gulp.dest('.tmp'))
    .pipe(reload({stream: true}));
});

gulp.task('styles', () => {<% if (includeSass) { %>
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))<% } else { %>
  return gulp.src('app/styles/*.css')
    .pipe($.if(dev, $.sourcemaps.init()))<% } %>
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

<% if (includeBabel) { -%>
gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({stream: true}));
});
<% } -%>

function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});

// inject bower components
gulp.task('wiredep', (done) => {<% if (includeSass) { %>
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));
<% } %>
  gulp.src('app/layouts/*.pug')
    .pipe(wiredep({<% if (includeBootstrap) { if (includeSass) { %>
      exclude: ['bootstrap-sass'],<% } else { %>
      exclude: ['bootstrap.js'],<% }} %>
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app/layouts'));

  done();
});

gulp.task('html:process', () => {
  return gulp.src(['app/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.cssnano({safe: true, autoprefixer: false})))
    .pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('html', gulp.series(
  gulp.parallel('views', 'styles'<% if (includeBabel) { %>, 'scripts'<% } %>),
  'html:process'
));

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html',
    '!app/*.pug'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('build:process', () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('build', gulp.series(
  gulp.parallel('lint', 'html', 'images', 'fonts', 'extras'),
  'build:process'
));

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve:process', (done) => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'app/*.html',
<% if (!includeBabel) { -%>
    'app/scripts/**/*.js',
<% } -%>
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/**/*.pug', gulp.parallel('views'));
  gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', gulp.parallel('styles'));
<% if (includeBabel) { -%>
  gulp.watch('app/scripts/**/*.js', gulp.parallel('scripts'));
<% } -%>
  gulp.watch('app/fonts/**/*', gulp.parallel('fonts'));
  gulp.watch('bower.json', gulp.parallel('wiredep', 'fonts'));

  done();
});

gulp.task('serve', gulp.series(
  gulp.parallel('clean', 'wiredep'),
  gulp.parallel('views', 'styles'<% if (includeBabel) { %>, 'scripts'<% } %>, 'fonts'),
  'serve:process'
));

gulp.task('default', gulp.series(
  (done) => {
    dev = false;
    done();
  },
  gulp.parallel('clean', 'wiredep'),
  'build'
));

gulp.task('serve:dist', gulp.series(
  'default',
  (done) => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['dist']
      }
    });

    done();
  }
));

gulp.task('serve:test', gulp.series(
  <% if (includeBabel) { %>'scripts',<% } %>
  (done) => {
    browserSync.init({
      notify: false,
      port: 9000,
      ui: false,
      server: {
        baseDir: 'test',
        routes: {
<% if (includeBabel) { -%>
          '/scripts': '.tmp/scripts',
<% } else { -%>
          '/scripts': 'app/scripts',
<% } -%>
          '/bower_components': 'bower_components'
        }
      }
    });

<% if (includeBabel) { -%>
    gulp.watch('app/scripts/**/*.js', gulp.parallel('scripts'));
<% } -%>
    gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
    gulp.watch('test/spec/**/*.js', gulp.parallel('lint:test'));

    done();
  }
));
