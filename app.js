#! /usr/bin/env node
var cli = require('cli');
var fs = require('fs');
var http = require('https');
var readline = require('readline-sync');
var chalk = require('chalk');
var search = require('youtube-crawler');
var dl = require('ytdl-core');
var os = require('os');
var mplayer = require('child_process').spawn;
var mkdirp = require('mkdirp');

var cliOptions;

cli.parse({
  song: ['s', 'The song you want to play.', 'string'],
  video: ['v', 'The video you want to watch.', 'string'],
  quality: ['q','The quality of the video/song', 'int']
  loop: ['l', 'Number of times to loop. 0 = Infinite.', 'int']
 // downloadonly: ['d', 'If you only want to download the song instead of playing it'],
});

cli.main(function (args, options) {
  settings();
  cliOptions = options;

  if (options.song || options.video) {
    lookup(options.song || options.video);
  }
});


function lookup(query) {
  cli.spinner('Looking up requested song');
  search(query, function (err, results) {
    if (err) cli.error(err);
    process.stdout.write('\n');
    for (i = 0; i < results.length; i++) {
      console.log(chalk.red('[') + i + chalk.red('] ') + chalk.white(results[i].title));
    }

    cli.spinner('', true);

    var input = readline.questionInt('What song do you want to play? #');
    download(results[input]);
  });
}

function settings() {
  if (!fs.existsSync(getLocation('settings'))) {
    var settings = {
      quality: 'highest'
    };

    fs.writeFileSync(getLocation('settings'), JSON.stringify(settings, null, 2));
    return settings;
  }
  else {
    return JSON.parse(fs.readFileSync(getLocation('settings')));
  }
}

function play(file) {
  var player = mplayer('mplayer', mplayerArgs(getLocation(cliOptions.video ? 'video' : 'music') + file));
  var isfiltered = false;

  console.log('Playing ' + file + '\n');

  player.stdout.on('data', function (data) {
    if (data.toString().substr(0,2) == 'A:' && !isfiltered) {
      player.stdout.pipe(process.stdout);
      isfiltered = true;
    }
  });

  player.on('exit', process.exit);

  // FIXME: In order for the input piping to mplayer to work I need to require this.
  require('readline').createInterface({input : process.stdin, output : process.stdout});
  process.stdin.pipe(player.stdin);

  player.on('error', function (data) {
    cli.fatal('There was an error playing your song, maybe you need to install mplayer?');
  });

}

function download(track) {
  var video = cliOptions.video;
  var songname = makeSafe(track.title) + (video ? '.mp4' : '.mp3');

  if (!fs.existsSync(getLocation(video ? 'video' : 'music') + songname)) {
    var options = (video ? {filter: 'video', quality: cliOptions.quality || settings().quality || 'highest'} : {filter: 'audioonly'});
    var size = 0;
    var stream = dl(track.link, options);
    stream.pipe(fs.createWriteStream(getLocation(video ? 'video' : 'music') + songname));

    stream.on('info', function (info, format) {
      size = parseInt(format.size);
    });

    stream.on('data', function () {
      var fileSize = fs.statSync(getLocation(video ? 'video' : 'music') + songname).size;
      cli.progress(fileSize / size);
    });

    stream.on('end', function () {
      play(songname);
    });
  }
  else {
    console.log('Song already found in offline storage, playing that instead.');
    play(songname);
  }
}

function getLocation(type) {
  switch (type) {
    case 'settings':
      var location = process.env['HOME'] + '/.yplayerrc';
    break;
    case 'music':
      var location = process.env['HOME'] + '/Music/yplayer/';
      mkdirp.sync(location);
    break;
    case 'video':
      var location = process.env['HOME'] + '/Videos/yplayer/';
      mkdirp.sync(location);
    break
  }
  return location;
}

function mplayerArgs (filename) {
  var audioEngines = {
    linux: 'alsa',
    darwin: 'coreaudio'
  }

  var audioEngine = audioEngines[os.platform()];
  if ( typeof cliOptions.loop !== 'undefined' ) {
      var loops = cliOptions.loop;
  } else {
      var loops = "0";
  }
  return ['-loop', loops, '-ao', audioEngine, filename];
}



function makeSafe(str) {
  return str.replace(/\//g, ' ');
}
