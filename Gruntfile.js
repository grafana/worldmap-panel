/* eslint import/no-extraneous-dependencies: 0 */

module.exports = (grunt) => {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-execute');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({

    copy: {
      src_to_dist: {
        cwd: 'src',
        expand: true,
        src: ['**/*.css', '**/*.html', '**/*.json', '!**/*.js', '!**/*.scss'],
        dest: 'dist'
      },
      pluginDef: {
        expand: true,
        src: [ 'README.md', 'CHANGELOG.md' ],
        dest: 'dist',
      },
      img_to_dist: {
        cwd: 'src/images',
        expand: true,
        flatten: true,
        src: ['*.*'],
        dest: 'dist/images/'
      },
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015'],
        plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of'],
      },
      dist: {
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext: '.js'
        }]
      },
    },

  });

  grunt.registerTask('default', ['copy:src_to_dist', 'copy:pluginDef', 'copy:img_to_dist', 'babel']);
};
