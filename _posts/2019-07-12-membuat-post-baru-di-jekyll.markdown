---
layout: post
title:  "Membuat Post baru di Jekyll"
date:   2019-07-12 08:56:38 +0700
categories: [jekyll,ubuntu]
---
Post ini ialah post lanjutan dari post [Memasang Jekyll di Ubuntu 18.04 Bionic dan Turunannya](/memasang-jekyll-di-ubuntu), untuk membuat post di Jekyll pertama - tama yang harus disiapkan yaitu menginisiasi Jekyll di folder kerja web/blog terlebih dahulu. Masukkan perintah berikut ke terminal :

```bash
jekyll new nama-web-blog
```

![screenshot 1](/images/new-post-1.png)

Ganti `nama-web-blog` dengan yang lain. Kemudian masuk ke folder baru dan mulai server Jekyll.

```bash
cd nama-web-blog
jekyll serve
```

Jekyll akan memulai server di [http://localhost:4000](http://localhost:4000). Buka untuk melihat web yang baru dibuat.

![screenshot 2](/images/new-post-2.png)

### Membuat Post
Untuk membuat post, buat file baru di folder `_posts` pada folder kerja web Jekyll. Sebelum menuliskan konten terlebih dahulu buat `front matter`, ini ialah bagian yang harus ada dalam setiap post di Jekyll. Isinya berupa keterangan -keterangan yang diawali oleh tiga symbol `-` juga diakhiri dengan tiga symbol tersebut. Jika bingung Jekyll telah membuat post awal di folder yang sama dengan format `.markdown` yang bisa disalin front matter-nya dan disesuaikan sesuai kebutuhan. Baru setelah ada front matter konten bisa ditulis. Post di Jekyll normalnya ditulis dengan format `markdown`, seluk beluk dan cara menulis markdown dapat dibaca di web [petanikode](https://www.petanikode.com/markdown-pemula/).


![screenshot 3](/images/new-post-3.png)

![screenshot 4](/images/new-post-4.png)


Simpan file baru dengan format nama `YYYY-MM-DD-judul-posts` dan format `.markdown`.


![screenshot 5](/images/new-post-5.png)

Selesai, untuk melihat post baru buka kembali [http://localhost:4000](http://localhost:4000), tapi pastikan server Jekyll telah dimulai.
