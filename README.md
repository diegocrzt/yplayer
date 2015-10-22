## yplayer

I initially made this player called gplayer, where the cli app used the Grooveshark database to get some music playing in your terminal. The project was deprecated after the close of Grooveshark (rip). But after all this happened I still needed a music player for my cli, so I made this. y(outube)player, it uses the same principles as gplayer, but now with youtube as a source.

## Install
```
npm install yplayer -g
```

## Usage
```
Usage:
  yplayer [OPTIONS] [ARGS]

Options:
  -s, --song             The song you want to play.
  -v, --video            The video you want to watch.
  -q, --quality          The quality you want to watch/play your media.
  -h, --help             Display help and usage details


```
Check [here](https://en.wikipedia.org/wiki/Youtube#Quality_and_formats) for Youtube's quality options (itag values).

## License
Check the `LICENSE.md` for more information.
