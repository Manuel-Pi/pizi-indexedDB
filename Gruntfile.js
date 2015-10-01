module.exports = function(grunt) {
	grunt.initConfig({
		srcFile: 'src/',
		testFile: 'tests/',
		serverFolder: 'C:/Users/e_na/Documents/GitHub/pizi-express-server/Apps/pizi-indexedDB/',
		jshint: {
			all: '<%= srcFile %>'
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
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	
	grunt.registerTask('deployDev', ['jshint', 'copy:deployDev']);
};