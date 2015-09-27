## yplayer

~~I made this initially to listen to music on tty based OSs, now it's one of my favorite ways to listen to music (in a terminal).~~
~~It's an entire music player in 60 lines of code, and also my first npm submission. Please have fun listening to your favorite music!~~

I initially made this player called gplayer, where the cli app used the Grooveshark database to get some music playing in your terminal. The project was deprecated after the close of Grooveshark (rip). But after all this happened I still needed a music player for my cli, so I made this. y(outube)player, it uses the same principles as gplayer, but now with youtube music.

##Install :
```
npm install yplayer -g
```

##Usage :
```
Usage:
  yplayer [OPTIONS] [ARGS]

Options:
  -s, --song             The song you want to download/play.
  -d, --downloadonly     If you only want to download the song instead of
                         playing it
  -h, --help             Display help and usage details


```

##Getting a Youtube Data API key

[Here](https://developers.google.com/youtube/registering_an_application) you can see Google's guide to getting an API key, make sure that the key that you get is the Server API.
