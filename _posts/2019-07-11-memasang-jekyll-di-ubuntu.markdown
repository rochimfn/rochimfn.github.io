---
layout: post
title:  "Memasang Jekyll di Ubuntu 18.04 Bionic dan Turunannya"
date:   2019-07-11 22:01:38 +0700
categories: [jekyll,ubuntu]
---
[**Jekyll**](https://jekyllrb.com) merupakan salah satu SSG (static site generator) yang populer. Jekyll dibuat dengan Ruby dan merupakan SSG yang diberi support lebih oleh GitHub untuk membuat GitHub Pages. Berikut langkah - langkah memasang Jekyll di Ubuntu 18.04 dan turunannya.
Pertama update dulu untuk memastikan paket yang akan dipasang merupakan yang terbaru. Buka terminal dan masukkan kode dibawah :


```bash
sudo apt update
```

Pasang depensi untuk Jekyll.

```bash
sudo apt-get install ruby-full build-essential zlib1g-dev
```

Mengatur agar Ruby Gems nantinya terpasang di folder user. Ketik atau salin perbaris.

```bash
echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Ketikkan perintah di bawah untuk memasang Jekyll.

```bash
gem install jekyll bundler
```

Periksa apakah Jekyll telah terpasang dengan perintah :

```bash
jekyll -v
```

Kalo outputnya **jekyll 3.8.6** maka Jekyll telah sukses terpasang di Ubuntu *(angka versi dapat berbeda).*



\*sumber :
[https://jekyllrb.com/docs/installation/ubuntu/](https://jekyllrb.com/docs/installation/ubuntu/)
