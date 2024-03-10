---
layout: post
title: "Protostar: Persiapan "
date: 2020-07-03 22:32:03 +0700
categories: [reversing, protostar]
---

**Protostar** memiliki berbagai macam challenge bertingkat yang dikhususkan untuk para pemula belajar reverse engineering dan materi lainnya. Keterangan lebih lanjut dapat dibaca di situs aslinya [exploit-exercises](https://exploit-exercises.lains.space/protostar/).

### Unduh Image

Protostar hadir dalam berkas dengan format "iso" yang dapat dijalankan dengan program virtual machine seperti virtualbox dan vmware. Berkas iso dapat diunduh di [https://exploit-exercises.lains.space/download/](https://exploit-exercises.lains.space/download/) atau di [Google Drive](https://drive.google.com/drive/folders/0B9RbZkKdRR8qbkJjQ2VXbWNlQzg?usp=sharing).

### Unduh dan pasang VMware Workstation Player

Untuk menjalankan protostar saya menggunakan VMware Workstation Player yang dapat diunduh dengan gratis di [situs resminya](https://www.vmware.com/products/workstation-player/workstation-player-evaluation.html) untuk sistem operasi windows dan linux.

### Membuat VM untuk protostar

Buat virtual machine baru dan atur agar virtual machine me load berkas iso dari protostar.

![Buat Virtual Machine](/images/persiapan-protostar-1.png)

Protostar menggunakan kernel linux versi 2.6 32bit. Next, nama vm dapat disesuaikan. Next, ukuran virtual disk biarkan saja karena nantinya juga tidak digunakan dan akan dihapus.

![Buat Virtual Machine](/images/persiapan-protostar-2.png)

Pada tampilan selanjutnya, sebelum menyelesaikan pembuatan, saya melakukan perubahan dengan memilih 'customize hardware'. Saya menambah alokasi RAM menjadi 2GB. Mengubah pengaturan core processor menjadi 2 cores. Close lalu Finish.

![Buat Virtual Machine](/images/persiapan-protostar-3.png)

Sebelum menjalankan protostar terlebih dahulu saya akan menghapus alokasi harddisk. Pilih nama virtual machine lalu pilih 'Edit virtual machine settings'. Menekan hardisk dan klik remove. Oke.

![Buat Virtual Machine](/images/persiapan-protostar-4.png)

### Menjalankan VM protostar

Play VM protostar maka. Saat memasuki grub, pilih saja live. Tunggu booting dan kita sudah ada di protostar.

![Buat Virtual Machine](/images/persiapan-protostar-4.png)

Untuk login dapat menggunakan kombinasi **user:user** untuk masuk sebagai akun user biasa atau **root:root** untuk masuk sebagai root. Saya masuk dengan akun user.

![Buat Virtual Machine](/images/persiapan-protostar-5.png)

Setelah masuk akan diberikan shell sh. Jika lebih suka dengan bash diprotostar juga disediakan. Untuk mematikan vm langsung saja dengan menekan tombol Shutdown Guest (vm ini tidak menggunakan harddisk sehingga aman saja). Sebagai catatan untuk mengeluar kan cursor dari vm dapat menggunakan kombinasi tombol **ctrl+alt**.

![Buat Virtual Machine](/images/persiapan-protostar-6.png)
