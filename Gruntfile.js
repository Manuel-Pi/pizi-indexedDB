module.exports = function(grunt) {
	grunt.initConfig({
		srcFile: 'src/',
		build: 'build/',
		testFile: 'tests/',
		serverFolder: 'C:/Users/e_na/Documents/GitHub/pizi-express-server/Apps/pizi-indexedDB/',
		jshint: {
			all: {
				options: {
					devel: true,
					esnext: true
				},
				src: '<%= srcFile %>'
			}
		},
		copy: {
			deployDev : {
					files : [
						{
							expand: true,
							cwd: '<%= srcFile %>',
							src: ['**'],
							dest: '<%= serverFolder %>'
						},
						{
							expand: true,
							cwd: '<%= testFile %>',
							src: ['**'],
							dest: '<%= serverFolder %>'
						}
					]
			},
			deployDevBabel : {
				files : [
					{
						expand: true,
						cwd: '<%= build %>',
						src: ['**'],
						dest: '<%= serverFolder %>'
					},
					{
						expand: true,
						cwd: '<%= testFile %>',
						src: ['**'],
						dest: '<%= serverFolder %>'
					}
				]
			}
		},
		clean: {
			options :{
				force : true
			},
			deployDev: '<%= serverFolder %>',
			build: '<%= build %>'
		},
		babel: {
			options: {
				sourceMap: false,
				"experimental": true,
        		"modules": "umd"
			},
			dist: {
				files: [{
					"expand": true,
					"cwd": '<%= srcFile %>',
					"src": ["**/*.js"],
					"dest": '<%= build %>',
					"ext": ".js"
				}]
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-babel');
	
	grunt.registerTask('build', ['jshint', 'clean:build', 'babel']);
	grunt.registerTask('deployDev', ['jshint', 'clean:deployDev', 'copy:deployDev']);
	grunt.registerTask('deployBuild', ['build', 'clean:deployDev', 'copy:deployDevBabel']);
};