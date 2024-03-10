---
layout: post
title: "Protostar: stack1 "
date: 2020-07-04 21:43:03 +0700
categories: [reversing, protostar]
---

stack1 dapat ditemukan bersama dengan [stack0](/belajar-reversing-protostar-stack0/) dan berkas untuk level selanjutnya pada directory `/opt/protostar/bin`. Deskripsi, tujuan dan source code dari stack1 dapat ditemukan di halaman resminya [disini](https://exploit-exercises.lains.space/protostar/stack1/). Sebelum masuk ke source code mari kita cek dulu dengan berkas stack1 dengan ulititas `file`.

![hasil utilitas file pada stack1](/images/protostar-stack1-1.png)

Outputnya sama dengan stack0. Mari kita lihat source codenya.

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv)
{
  volatile int modified;
  char buffer[64];

  if(argc == 1) {
      errx(1, "please specify an argument\n");
  }

  modified = 0;
  strcpy(buffer, argv[1]);

  if(modified == 0x61626364) {
      printf("you have correctly got the variable to the right value\n");
  } else {
      printf("Try again, you got 0x%08x\n", modified);
  }
}
```

Secara garis besar alur program tersebut ialah mengecek apakah ada argumen yang dimasukkan, jika tidak maka program akan keluar dan mengeluarkan pesan error. Kemudian mengisi variable **modified** dengan nilai 0. Selanjutnya dipanggil fungsi **strcpy()**. Terakhir program terdapat percabangan jika nilai modified ialah **0x61626364** maka pesan sukses akan ditampilkan (tujuan kita). Namun jika tidak pesan coba lagi akan ditampilkan beserta nilai dari modified.

Pertama mari kita lihat apa yang dilakukan oleh fungsi strcpy. Gunakan perintah berikut untuk melihat manual dari fungsi strcpy.

```bash
man strcpy
```

![manual strcpy](/images/protostar-stack1-2.png)

Berdasarkan deskripsi pada manual dapat diketahui bahwa fungsi strcpy ialah untuk menyalin string yang ditunjuk oleh argumen kedua ke yang ditunjuk oleh argumen pertama. Dalam stack1 ini, dari argumen yang dimasukkan, ke buffer yang disiapkan sebelumnya. Lanjut membaca manual masih pada paragraf yang sama terdapat kalimat yang mengharuskan kita untuk memastikan bahwa tujuan penyalinan memiliki besar yang cukup untuk menampung string dari sumber. Sepertinya fungsi ini memiliki kerentanan yang sama dengan fungsi `gets` yaitu memungkinkan terjadinya bufferoverflow. Dan benar saja jika kita membaca manual dari fungsi strcpy pada sistem operasi linux yang lebih baru terdapat peringatan penggunaan fungsi ini.

![manual strcpy](/images/protostar-stack1-3.png)

#### Langkah penyelesaian

Pertama mari kita coba menjalankan executable dengan argumen dengan besar normal. Lalu dengan besar melebihi buffer.

```bash
./stack1 dikit
./stack1 wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww
```

output :
![menjalankan strcpy](/images/protostar-stack1-4.png)

Saat dijalankan dengan argumen pendek nilai dari modified ialah 0x00000000. Sedangkan saat dijalankan dengan argumen sebesar ukuran buffer + 1 byte nilai modified menjadi 0x00000077, nilai modified berubah. Tapi dari mana datangnya 77 ini? 1 byte tambahan yang kita masukkan ialah karakter w tapi kenapa yang muncul ialah 77? Pertayaan ini dapat terjawab dengan melihat manual dari ASCII.

```bash
man ascii
```

output :
![manual ascii](/images/protostar-stack1-5.png)

77 merupakan nilai hex dari karakter w. stack1 menginginkan nilai modified ialah 0x61626364. Jadi karakter apakah yang harus kita masukkan? mari kita pisah - pisah terlebih dahulu, 61 62 63 64. Sekarang kita cari karakter apakah ini di manual ascii. 61 = a, 62 = b, 63 = c dan 64 = d. Mari kita coba gunakan.

```bash
./stack1 wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwabcd
```

output :
![menjalankan stack dengan input argumen wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwabcd ](/images/protostar-stack1-6.png)

Tidak berhasil, kalau diperhatikan outputnya, input argumen yang kita masukkan sepertinya terbalik 64 63 62 61. Kenapa ini bisa terjadi? Jika mengunjungi [halaman resminya](https://exploit-exercises.lains.space/protostar/stack1/) terdapat 2 hint, yang pertama ialah menggunakan manual ascii dan kedua ialah bahwa protostar adalah little endian dan diberikan link menuju halaman wikipedia [berikut](https://en.wikipedia.org/wiki/Endianness). Berdasarkan hint tersebut maka perlu dilakukan penyusunan ulang input kita menjadi seperti berikut.

```bash
./stack1 wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdcba
```

output :
![menjalankan stack dengan input argumen wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwdcba ](/images/protostar-stack1-7.png)

Berhasil!
