'use strict';
module.exports = function(grunt) {
    // Load all tasks
    require('load-grunt-tasks')(grunt);
    // Show elapsed time
    require('time-grunt')(grunt);


    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bwr: grunt.file.readJSON('.bowerrc'),
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'src/**/*.js'
            ]
        },
        less: {
            dev: {
                
            },
            build: {
                // config for this subtask is dynamically generated for live build - see the prepModulesBuild custom task below
            }
        },
        html2js:{
            // config dynamically generated - see the prepModules custom task
        },
        uglify: {
            // config dynamically generated for live build - see the prepModulesBuild custom task
        },
        concat: {
            // config dynamically generated - see the prepModules custom task
        },
        clean: {
            tpls: ['dist/**/*-templates.js']
        },
        copy: {
            // config dynamically generated - see the prepModules custom task
        },
        replace: {
            devToLive: {
                src: ['dist/**/*.min.*'],
                overwrite: true,
                replacements: [{
                    from: /(wwwdev2?)/g,
                    to: 'www'
                }]
            }
        },
        bower_concat: {
            all: {
                dest: 'dist/vendor.js',
                cssDest: 'dist/vendor.css',
                exclude: [
                    'ualib-ui'
                ]
            }
        },
        bowercopy: {
            peer: {
                options: {
                    destPrefix: 'src/modules'
                },
                // By not specifying a destination, you are denoting
                // that the lodash directory structure should be maintained
                // when copying.
                // For example, one of the files copied here is
                // 'lodash/dist/lodash.js' -> 'public/js/libs/lodash/dist/lodash.js'
                src: 'ualib*/dist/**/*.js'
            }
        },
        bowerInstall: {
            target: {
                // Point to the files that should be updated when
                // you run `grunt bower-install`
                src: [
                    'src/index.html'
                ],

                // Optional:
                // ---------
                cwd: '',
                dependencies: false,
                devDependencies: true,
                exclude: ['bootstrap']
            }
        },
        autoprefixer: {
            options: {
                browsers: ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12']
            },
            dev: {
                options: {
                    map: {
                        prev: 'dist'
                    }
                },
                src: 'dist/<%=pkg.name%>.css'
            },
            build: {
                src: 'assets/css/<%=pkg.name%>.min.css'
            }
        },
        bump: {
            options: {
                files: ['pkg.json', 'bower.json'],
                updateConfigs: ['pkg'],
                commit: false,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['pkg.json', 'bower.json'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
                globalReplace: false,
                prereleaseName: false,
                regExp: false
            }
        },
        watch: {
            less: {
                files: [
                    'src/*.less',
                    'src/**/*.less'
                ],
                tasks: ['less:dev', 'autoprefixer:dev']
            },
            js: {
                files: [
                    'src/**/*.js',
                    '<%= jshint.all %>'
                ],
                tasks: ['jshint', 'concat']
            },
            livereload: {
                // Browser live reloading
                // https://github.com/gruntjs/grunt-contrib-watch#live-reloading
                options: {
                    livereload: false
                },
                files: [
                    'assets/css/<%=pkg.name%>.css',
                    'app/scripts.js',
                    'templates/*.php',
                    '*.php'
                ]
            }
        }
    });

    // Register custom tasks

    // prepModules task is based off of this SO answer: http://stackoverflow.com/a/21921205/5683559
    // It will dynamically add concatenation, html2js, copy (for demo files), and less tasks for any module added to src/modules
    //
    // **Override this for individual modules by adding a subtask with the module's directory name
    // Example for less override:
    // less: {
    //      dev: {...},
    //      build: { ... },
    //      moduleName: {...override here...} // less:moduleName will need to be run separate from less:dev
    //  }
    grunt.registerTask('prepModules', "Prepares modules for concatenation", function(target){
        // get module directories
        grunt.file.expand('src/modules/*').forEach(function(dir){
            // infer module name from directory name
            var dirName = dir.substr(dir.lastIndexOf('/')+1);

            /**
             * Generate concat subtasks
             */
            // get current concat object
            var concat = grunt.config.get('concat') || {};

            // create concat subtask for each module - concatenating their sources into separate build files per module
            if (!concat.hasOwnProperty[dirName]){
                concat[dirName] = {
                    src: [dir + '/**/*.js'],
                    dest: 'dist/' + dirName + '/' + dirName + '.js'
                };
                concat[dirName+'_tpl'] = {
                    src: ['dist/' + dirName + '/*.js', '!dist/' + dirName + '/*.min.js'],
                    dest: 'dist/' + dirName + '/' + dirName + '.js'
                };
            }

            // add concat subtask to concat tasks in initConfig
            grunt.config.set('concat', concat);

            /**
             * Generate less subtasks
             */
            // Get less config object
            var less = grunt.config.get('less') || {};
            // check if it has a `dev` subtask. If not, create an empty one
            if (!less.hasOwnProperty('dev')){
                less.dev = {};
            }
            // check if it has `files` object
            if (!less.dev.hasOwnProperty('files')) {
                less.dev.files = [];
            }
            // If it does have a `files` object, ensure that it's an array of objects
            else if (!Array.isArray(less.dev.files)) {
                less.dev.files = [less.dev.files];
            }

            if (!less.hasOwnProperty(dirName)){
                less.dev.files.push({
                    options: {
                        compress: false,
                        // LESS source map
                        // To enable, set sourceMap to true and update sourceMapRootpath based on your install
                        sourceMap: true,
                        sourceMapFilename: 'dist/' + dirName + '/' + dirName + '.css.map'
                    },
                    src: [dir + '/**/*.less'],
                    dest: 'dist/' + dirName + '/' + dirName + '.css'
                });
            }
            grunt.config.set('less', less);

            /**
             * Generate html2js subtasks
             */
            var html2js = grunt.config.get('html2js') || {};
            if (!html2js.hasOwnProperty(dirName)){
                // Tonkenize the directory name to camcel case from hyphenated or snakecase
                var modName = dirName.replace(/[-_]([a-zA-Z0-9])/g, function(g){ return g[1].toUpperCase(); });
                html2js[dirName] = {
                    options: {
                        base: 'src/modules/' + dirName
                    },
                    src: dir + '/**/*.tpl.html',
                    dest: 'dist/' + dirName + '/' + dirName + '-templates.js',
                    module: modName + '.templates'
                };
            }
            grunt.config.set('html2js', html2js);

            /**
             * Generate copy subtasks
             */
            var copy = grunt.config.get('copy') || {};
            if (!copy.hasOwnProperty(dirName)){
                copy[dirName] = {
                    src: [dir + '/**/demo.html'],
                    dest: 'dist/' + dirName + '/demo.html'
                };
            }
            grunt.config.set('copy', copy);
        });
    });

    grunt.registerTask('prepModulesBuild', "Uglify modules", function(target){
        // get module directories
        grunt.file.expand('dist/*').forEach(function(dir){
            // infer module name from directory name
            var dirName = dir.substr(dir.lastIndexOf('/')+1);

            /**
             * Generate uglify subtasks
             */
            // get current concat object
            var uglify = grunt.config.get('uglify') || {};

            // create uglify subtask for each module - uglify build files into separate minified files per module
            if (!uglify.hasOwnProperty[dirName]){
                uglify[dirName] = {
                    options: {
                        sourceMap: true,
                        sourceMapName: dir + '/' + dirName + '.map'
                    },
                    src: [dir + '/' + dirName + '.js'],
                    dest: dir + '/' + dirName + '.min.js'
                };
            }

            // add uglify subtask to uglify tasks in initConfig
            grunt.config.set('uglify', uglify);

            /**
             * Generate less subtasks
             */
            // Get less config object
            var less = grunt.config.get('less') || {};
            // check if it has a `build` subtask. If not, create an empty one
            if (!less.hasOwnProperty('build')){
                less.build = {};
            }
            // check if it has `files` object
            if (!less.build.hasOwnProperty('files')) {
                less.build.files = [];
            }
            // If it does have a `files` object, ensure that it's an array of objects
            else if (!Array.isArray(less.build.files)) {
                less.build.files = [less.build.files];
            }

            if (!less.hasOwnProperty(dirName)){
                less.build.options = {
                    compress: true
                };
                less.build.files.push({
                    src: [dir + '/**/*.css', dir + '/**/*.less'],
                    dest: 'dist/' + dirName + '/' + dirName + '.min.css'
                });
            }
            grunt.config.set('less', less);
            
        });
    });

    // Register tasks
    grunt.registerTask('default', [
        'prepModules', 'less:dev', 'html2js', 'concat', 'clean', 'copy'
    ]);
    grunt.registerTask('dev', [
        'bowercopy',
        'html2js:dev',
        'concat:dev',
        'concat:peer',
        'jshint',
        'less:dev',
        'bowerInstall',
        'concat:demo'
    ]);
    grunt.registerTask('build', [
        'jshint',
        'prepModulesBuild',
        'less:build',
        'uglify',
        'replace:devToLive'
    ]);
};
