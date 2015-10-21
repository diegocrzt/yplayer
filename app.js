#! /usr/bin/env node
var cli = require('cli');
var fs = require('fs');
var http = require('https');
var readline = require('readline-sync');
var chalk = require('chalk');
var search = require('youtube-search');
var dl = require('ytdl-core');
var mplayer = require('child_process').spawn;

cli.parse({
  song: ['s', 'The song you want to download/play.'],
  downloadonly: ['d', 'If you only want to download the song instead of playing it'],
});

cli.main(function (args, options) {
  settings();
  if (options.song) {
    lookup(args.join(' '));
  }
});


function lookup(query) {
  cli.spinner('Looking up requested song');
  search(query, {key : settings().apikey}, function (err, results) {
    if (err) cli.error(err);
    process.stdout.write('\n');
    for (i = 0; i < results.length; i++) {
      if (results[i].kind != 'youtube#channel' && results[i].kind != 'youtube#playlist') {
          console.log(chalk.red('[') + i + chalk.red('] ') + chalk.white(results[i].title));
      }
    }

    cli.spinner('', true);

    var input = readline.questionInt('What song do you want to play? #');

    download(results[input]);
  });
}

function settings() {
  if (!fs.existsSync(getLocation('settings'))) {
    var settings = {
      'apikey': 'add_your_youtube_api_code_here'
    };

    fs.writeFileSync(getLocation('settings'), JSON.stringify(settings, null, 2));
    cli.fatal('Go to ~/.yplayerrc and add Youtube Data API key.');
  }
  else {
    var settings = JSON.parse(fs.readFileSync(getLocation('settings')));
    if (settings.apikey == 'add_your_youtube_api_code_here') cli.fatal('Go to ~/.yplayerrc and add Youtube Data API key.');
    else return settings;
  }
}

function play(file) {
  var player = mplayer('mplayer', ['-ao','alsa', getLocation('music') + file]);
  var isfiltered = false;

  console.log('Playing ' + file + '\n');

  player.stdout.on('data', function (data) {
    if (data.toString().substr(0,2) == 'A:' && !isfiltered) {
      player.stdout.pipe(process.stdout);
      isfiltered = true;
    }
  });

  // FIXME: In order for the input piping to mplayer to work I need to require this.
  require('readline').createInterface({input : process.stdin, output : process.stdout});
  process.stdin.pipe(player.stdin);

  player.on('error', function (data) {
    cli.fatal('There was an error playing your song, maybe you need to install mplayer?');
  });

}

function download(track) {
  var songname = makeSafe(track.title) + '.mp3';

  if (!fs.existsSync(getLocation('music') + songname)) {
    var stream = dl(track.link, {filter : 'audioonly'});
    stream.pipe(fs.createWriteStream(getLocation('music') + songname));

    stream.on('end', function () {
      play(songname);
    })
  }
  else {
    console.log('Song already found in offline storage, playing that instead.');
    play(songname);
  }
}

function getLocation(type) {
  var prefix = '/home/';

  switch (type) {
    case 'settings':
      return prefix + process.env['USER'] + '/.yplayerrc';
    break;
    case 'music':
      return prefix + process.env['USER'] + '/Music/';
    break;
  }
}

function makeSafe(str) {
  return str.replace(/\//g, '|');
}
