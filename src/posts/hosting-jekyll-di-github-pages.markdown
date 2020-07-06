---
layout: post
title:  "Hosting Jekyll SSG di Github Pages"
date:   2019-07-12 12:29:38 +0700
categories: [jekyll,github]
---

Github Pages merupakan layanan hosting website statis dari Github, untuk menggunakan layanan ini terlebih dahulu harus memiliki akun di [GitHub](https://github.com/join).

Agar Jekyll dapat di host di `gh-pages` (singkatan untuk GitHub pages) file - file Jekyll harus ditempatkan di repository dengan nama `username.github.io` namun apa bila telah menggunakan gh-pages sebelumnya dan repository `username.github.io` telah terisi oleh web statis lain Jekyll dapat ditempatkan di repository lain dengan syarat file - file Jekyll berada pada *branch* `gh-pages`.

### Mengupload Jekyll ke `username.github.io`

Buat repository dengan nama `username.github.io` (ubah username dengan username akun github) di GitHub.
Lalu buka file `_config.yml` yang terdapat pada folder kerja web Jekyll dengan teks editor. Cari baris

```yaml
url: ""
```

dan ubah menjadi

```yaml
url: "https://username.github.io"
```

Save!
Buka terminal, `cd` ke folder kerja web Jekyll

```bash
cd nama-web-blog
```

Pastikan `git` telah terpasang. Jalankan perintah berikut perbaris :

```bash
git init
git remote add origin https://github.com/username/username.github.io.git
git add -A
git commit -am "Host Jekyll"
git push origin master
```

Masukkan username dan password akun GitHub dan selesai, web Jekyll dapat diakses di https://username.github.io

### Mengupload Jekyll ke repository bukan `username.github.io`

Buat repository baru dengan nama apapun misal `blog`, nantinya web akan dapat diakses dengan url `http://username.github.io/blog`. Buka file `_config.yml` dengan teks editor dan ubah baris

```yaml
baseurl: ""
url: ""
```

menjadi

```yaml
baseurl: "/blog"
url: "https://username.github.io"
```

buka terminal, masuk ke folder web Jekyll, lalu inisiasi git dan upload dengan perintah berikut :

```bash
cd nama-web-blog
git init
git remote add origin https://github.com/username/blog.git
git checkout -b gh-pages
git add -A
git commit -am "Host Jekyll"
git push origin gh-pages
```

Selesai, jika proses benar maka web Jekyll dapat di akses di `https://username.github.io/blog`
