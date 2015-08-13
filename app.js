var cli = require('cli');
var fs = require('fs');
var readline = require('readline-sync');
var chalk = require('chalk');

var search = require('youtube-search');
var dl = require('youtube-dl');

var mplayer = require('child_process').spawn;

cli.parse({
  song: ['s', 'The song you want to download/play.'],
  downloadonly: ['d', 'If you only want to download the song instead of playing it'],
  offline: ['o', 'If you want to listen to already downloaded songs']
});

cli.main(function (args, options) {
  console.log(options);
  check_api();
  if (options.song) {
    lookup(args.join(' '));
  }
  else if (options.offline) {
    offline();
  }
});


function lookup(query) {
  cli.spinner('Looking up requested song');
  search(query, {key : check_api()}, function (err, results) {
    if (err) cli.error(err);

    for (i = 0; i < results.length; i++) {
      if (results[i].kind != 'youtube#channel' && results[i].kind != 'youtube#playlist') {
          console.log(chalk.blue('[') + i + chalk.blue('] ') + results[i].title);
      }
    }

    cli.spinner('Done!', true);

    var input = readline.questionInt('What song do you want to play? #');
    console.reset();
    if (!fs.existsSync(get_location('music') + results[input].title)) {
      cli.spinner('Downloading song');
      dl.exec(results[input].link, ['-x', '--audio-format', 'mp3', '-o', get_location('music') + results[input].title + '.%(ext)s'], {}, function (err, output) {
        if (err) cli.error(err);
        play(get_location('music') + results[input].title);
      });
    }
    else {
      console.log('Song already found in ' + get_location('music') + ', playing it now.');
      play(get_location('music') + results[input].title);
    }
  });
}

function check_api() {
  if (!fs.existsSync(get_location('api'))) {
    var settings = {
      'apikey': 'add_your_youtube_api_code_here'
    };

    fs.writeFileSync(get_location('api'), JSON.stringify(settings));
    return settings.api_key;
  }
  else {
    var api_key = JSON.parse(fs.readFileSync(get_location('api'))).apikey;
    if (api_key == 'add_your_youtube_api_code_here') cli.fatal('Go to ~/.yplayerrc and a Youtube Data API key.');
    else return api_key;
  }
}

function play(file) {
	var player = mplayer('mplayer', ['-ao','alsa', file + '.mp3']); var isfiltered = false;
  // player.stdout.on('data', function (data) { if (data.toString().substr(0,2) == 'A:' && !isfiltered) { player.stdout.pipe(process.stdout);}});
	player.stdout.pipe(process.stdout);
	process.stdin.pipe(player.stdin);
	player.on('error', function (data) {
    cli.fatal('There was an error playing your song, maybe you need to install mplayer?');
  });
}

function get_location(type) {
  var prefix = '/home/';

  switch (type) {
    case 'api':
      return prefix + process.env['USER'] + '/.yplayerrc';
    break;
    case 'music':
      return prefix + process.env['USER'] + '/Music/';
    break;
  }
}

console.reset = function () {
  return process.stdout.write('\033c');
}
