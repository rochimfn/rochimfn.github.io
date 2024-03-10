---
layout: post
title:  "Memasang Openjdk 11 di Ubuntu 18.04"
date:   2019-07-24 06:06:38 +0700
categories: [java,ubuntu]
---

Openjdk merupakan set tools dasar untuk pengembangan aplikasi berbasis java. Untuk memasangnya di OS Ubuntu caranya sangat mudah karena Openjdk 11 sudah tersedia di repository utama Ubuntu 18.04.

Pertama lakukan `apt update` untuk memastikan Ubuntu telah memiliki daftar paket terbaru dari repository

```bash
sudo apt update
```

Gunakan perintah berikut untuk mengetahui openjdk versi berapa saja yang tersedia di repository Ubuntu Bionic

```bash
apt-cache search openjdk
```
![SS Openjdk 1](/images/openjdk-1.png)

Untuk memasang Openjdk versi 11 gunakan perintah

```bash
sudo apt install openjdk-11-jdk
```

Terakhir pastikan `java` dan `javac` memiliki angka versi yang sama

```bash
javac --version
java --version
```
![SS Openjdk 2](/images/openjdk-2.png)

Selesai.
