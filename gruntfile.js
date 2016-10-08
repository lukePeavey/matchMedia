module.exports = function(grunt) {
	"use strict";
	require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

	grunt.initConfig({
		uglify: {
			options: { 
				separator: ';\n\n',
			},
			build: {
				files: {
					'matchMedia.min.js' : 'matchMedia.js',
				}
			}
		}
	})
}