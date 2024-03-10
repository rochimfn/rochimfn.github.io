---
layout: post
title:  "Hal yang dilakukan setelah memasang Ubuntu 18.04 Bionic Beaver"
date:   2019-08-26 19:09:03 +0700
categories: [ubuntu]
---
![Screenshot Kubuntu 18.04](/images/ssafterinstall.png)


Ubuntu merupakan distribusi GNU/Linux yang sangat populer. Selain karena sistemnya yang sangat stabil dan dukungan software yang lebih baik dibandingkan distribusi lainnya, Ubuntu juga ramah kepada pengguna baru dengan OS yang bisa digunakan secara langsung setelah dipasang karena memiliki banyak software preinstalled. Namun tidak semua orang membutuhkan(juga menyukai) software - software itu sehingga memilih Ubuntu dengan opsi penginstalan minimal, yaitu Ubuntu yang "hanya" disertai Desktop Environment, program essensial (misal web browser).

Hal - hal yang perlu dilakukan setelah memasang Ubuntu (minimal install)
* ### Update system
System perlu diperbarui terutama untuk mendapatkan patch keamanan terbaru
```bash
sudo apt update
sudo apt upgrade -y
```
* ### Memasang bash completion
Bash completion memudahkan asistensi pengetikan pada shell bash dengan fitur autocompletenya. Cara penggunaannya cukup tekan tombol `tab` setelah mengetikkan beberapa huruf awal perintah.
```bash
sudo apt install bash-completion
```
* ### Memasang codec multimedia
Codec diperlukan dalam pemutaran berbagai file multimedia
```bash
sudo apt install ubuntu-restricted-extras
```
* ### Memasang aplikasi pilihan dari repository bawaan
```bash
sudo apt install mpv audacious vim vlc telegram-desktop
```

**mpv :** Program pemutar video yang sederhana dan ringan

**audacious:** Program pemutar audio yang sangat populer

**vim :** Program text editor yang berjalan di terminal

**vlc :** Program pemutar video yang kaya fitur

**telegram :** Program layanan chat berbasis cloud

* ### Memasang xdman
xdman merupakan program download manager yang gratis dan powerfull.
Download file tar.gz di [http://xdman.sourceforge.net/](http://xdman.sourceforge.net/)
```bash
tar xvzf Downloads/xdm*.tar.xz
cd xdm*
sudo ./install.sh
```
pasang ekstensi browser monitoring di tiap browser

* ### Memasang Google Chrome
Google Chrome salah satu web browser terbaik yang ada
Download file .deb di [https://www.google.com/chrome/](https://www.google.com/chrome/)
pasang dengan
```bash
sudo dpkg -i Downloads/google*deb
sudo apt -f install
```

* ### Memasang spotify client
Spotify merupakan penyedia layanan streaming musik dan podcast yang sangan populer
```bash
curl -sS https://download.spotify.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb http://repository.spotify.com stable non-free" | sudo tee /etc/apt/sources.list.d/spotify.list
sudo apt-get update && sudo apt-get install spotify-client
```

* ### Memasang tlp
tlp merupakan progam yang sangat umum digunakan untuk menghemat penggunaan baterai

```bash
sudo apt install tlp tlp-rdw
sudo tlp start
```

* ### Memasang program untuk developer
>**Git**
```bash
sudo apt install git
```
>**Visual Studio Code**
>>Download file .deb di [https://code.visualstudio.com/download](https://code.visualstudio.com/download)
pasang dengan 
```bash
sudo dpkg -i Downloads/code*deb
sudo apt -f install
```
>**Sublime text 3** (via snap)
```bash
sudo snap install sublime-text --classic
```
>**Openjdk-11**
```bash
sudo apt install openjdk-11-jdk
```
>**Eclipse** (via snap)
```bash
sudo snap install --classic
```
>**nodejs**
>>dapat dibaca di: [https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/](https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/)

### Selesai