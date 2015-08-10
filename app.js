#!/usr/bin/env node
var color = require('colors');
var search = require('youtube-search');
var dl = require('youtube-dl');
var _ = require('underscore');

var fs = require('fs');
var http = require('http');
var mplayer = require('child_process').spawn;
var readline = require('readline').createInterface({input : process.stdin, output : process.stdout});

var args = []; for (i=0;i<process.argv.join(' ').split(' -').length;i++) {if (i!=0) args[i-1] = process.argv.join(' ').split(' -')[i]}; if (args.length == 0) help();
if (!fs.existsSync('/home/' + process.env['USER'] + '/Music')) {fs.mkdirSync('/home/' + process.env['USER'] + '/Music', 0775)}
_.each(args, function (item) {
	if (item == '-help' || item == 'h') { help();}
	else if (item == 'o' || item == '-offline') {return offline(); process.exit(0);}
	else {return lookup(item.substr(2,item.length)); process.exit(0);}
});

function help() {
	process.stdout.write('yplayer v0.0.5, by: Bram \"#96AA48\" van der Veen\n\n');
	process.stdout.write('Usage : yplayer [options] <-s song>\n');
	var options = [
		['-s <song>, --song <song>', 'Song to listen to'],
		['[-o], [--offline]', '\tOffline mode/listen to cached songs'],
		['[-h], [--help]', '\t\tDisplay helpful information (this stuff)']
	];
	for (i=0;i<options.length;i++) {process.stdout.write('\t' + options[i][0] + '\t' + options[i][1] + '\n')};
	process.exit(0);
}

function offline() {
	var files = []; for (i=0;i<fs.readdirSync('/home/' + process.env['USER'] + '/Music').length;i++) {files[i] = fs.readdirSync('/home/' + process.env['USER'] + '/Music')[i];};
	for (i=0;i<files.length;i++) {process.stdout.write('['.cyan + i + '] '.cyan + (files[i].split('.mp3')[0]).bold + '\n'); if (i==files.length - 1) process.stdout.write('\n');};
	readline.question('What song do you want to play? #', function (input) {if (parseInt(input) != NaN) play('/home/' + process.env['USER'] + '/Music/' + files[input]);});
}

function lookup(query) {
	checkApi(function (api) {
		search(query, {key : api}, function (err, results) {
			if (err) console.warn(err);
			for (i = 0; i < results.length; i++) {
				if (results[i].kind != 'youtube#channel' && results[i].kind != 'youtube#playlist') {
					process.stdout.write('['.cyan + i + '] '.cyan + (results[i].title).bold + '\n');
				}
			}

			readline.question('What song do you want to play? #', function (input) {
				if (parseInt(input) != NaN) {
					if (!fs.existsSync(getLocation('download', results[input].title))) {
						dl.exec(results[input].link, ['-x', '--audio-format', 'mp3', '-o', getLocation('download', results[input].title)], {}, function (err, output) {
							if (err) process.stderr.write(err.toString());
							play(getLocation('download', results[input].title));
						});
					}
					else {
						play(getLocation('download', results[input].title));
					}
				}
				else {
					process.stdout.write('You didn\'t give me a number, exiting.');
				}
			});
		});
	})
}

function checkApi(callback) {
	if (!fs.existsSync(getLocation('api'))) {
		readline.question('Enter your Youtube Data API key :', function (input) {
			var settings = {
				'apikey': input
			}
			process.stdout.write('Added Youtube Data API key.\n'.green);
			fs.writeFileSync(getLocation('api'), JSON.stringify(settings));
			callback(settings.apikey);
		});
		process.stdout.write('\n');
	}
	else {
		callback(JSON.parse(fs.readFileSync(getLocation('api'))).apikey);
	}
}

function getLocation(type, data) {
	if (type == 'download') {
		return '/home/' + process.env['USER'] + '/Music/' + data + '.mp3';
	}
	else if (type == 'api') {
		return '/home/' + process.env['USER'] + '/.yplayerrc';
	}
}

function play(file) {
	var player = mplayer('mplayer', ['-ao','alsa', file]); var isfiltered = false;
	player.stdout.on('data', function (data) { if (data.toString().substr(0,2) == 'A:' && !isfiltered) { player.stdout.pipe(process.stdout); isfiltered = true;}});
	process.stdin.pipe(player.stdin);
	player.on('error', function (data) {process.stdout.write('There was an error playing your song, maybe you need to install mplayer?\n');process.exit(0);});
}
