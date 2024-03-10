---
layout: post
title: "Memasang youtube-dl di Ubuntu"
date: 2019-11-24 08:55:03 +0700
categories: [ubuntu]
---

**youtube-dl** is a command-line program to download videos from YouTube.com and a few more sites. It requires the Python interpreter, version 2.6, 2.7, or 3.2+, and it is not platform specific. It should work on your Unix box, on Windows or on macOS. It is released to the public domain, which means you can modify it, redistribute it or use it however you like. [(https://ytdl-org.github.io/youtube-dl/)](https://ytdl-org.github.io/youtube-dl/)

**youtube-dl** sudah tersedia di repository resmi Ubuntu dan dapat dipasang dengan mudah dengan command berikut

```bash
sudo apt update && sudo apt install youtube-dl

```

Namun versi youtube-dl yang tersedia di repository tidak selalu yang terbaru. Sehingga direkomendasikan untuk memasang secara langsung dari repository github milik [ytdl-org](https://github.com/ytdl-org/youtube-dl).

### Memasang menggunakan wget

Jika yang tersedia di sistem ialah wget

```bash
sudo wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl
sudo chmod a+rx /usr/local/bin/youtube-dl
```

### Memasang menggunakan curl

Jika yang tersedia di sistem ialah curl

```bash
sudo curl -L https://yt-dl.org/downloads/latest/youtube-dl -o /usr/local/bin/youtube-dl
sudo chmod a+rx /usr/local/bin/youtube-dl
```

### Contoh penggunaan youtube-dl

Mengunduh video langsung dari youtube

```bash
youtube-dl https://www.youtube.com/watch?v=pDPsgJFNDUc
```

Menguduh video playlist dari youtube

```bash
youtube-dl -ic https://www.youtube.com/playlist?list=PLlrxD0HtieHhS8VzuMCfQD4uJ9yne1mE6
```

keterangan :
**-i** menunjukkan bahwa yang akan diunduh ialah playlist. Jika tidak diberikan argumen -i tersebut youtube-dl hanya akan mengunduh video pertama dari playlist.
**-c** menunjukkan continue, maksudnya agar pengunduhan bisa dilanjutkan bila terputus sebelum pengunduhan selesai.

Mengunduh playlist dari youtube dengan subtitle

```bash
youtube-dl -ic --all-subs https://www.youtube.com/playlist?list=PLlrxD0HtieHhS8VzuMCfQD4uJ9yne1mE6
```

Mengunduh hanya subtitle playlist dari youtube

```bash
youtube-dl -ic --skip-download --all-subs https://www.youtube.com/playlist?list=PLlrxD0HtieHhS8VzuMCfQD4uJ9yne1mE6
```

Mengunduh playlist dari youtube sebagai file mp3

```bash
youtube-dl -cit --extract-audio --audio-format mp3 https://www.youtube.com/playlist?list=PLTGU-M8ykHxqzXfKnClnhp78_L5VJI7tP
```

Seluruh opsi dari youtube-dl dapat dilihat dengan `youtube-dl --help`

Done
