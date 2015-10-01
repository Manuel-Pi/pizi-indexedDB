module.exports = function(grunt) {
	grunt.initConfig({
		srcFile: 'src/',
		testFile: 'tests/',
		serverFolder: 'C:/Developppment/Web/Servers/pizi-express-server/Apps/pizi-indexedDB/',
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
			},
		},
		clean: {
			options :{
				force : true
			},
			deployDev: '<%= serverFolder %>'
		}
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	
	grunt.registerTask('deployDev', ['jshint', 'clean:deployDev', 'copy:deployDev']);
};