---
layout: post
title: "Protostar: stack2 "
date: 2020-07-05 10:33:03 +0700
categories: [reversing, protostar]
---

Level ketiga dari protostar, stack2, dapat kita temukan pada directory `/opt/protostar/bin`. Keterangan lebih lanjut dapat dilihat pada laman resminya [disini](https://exploit-exercises.lains.space/protostar/stack2/) dan berikut merupakan output dari utilitas `file` pada berkas stack2.

![hasil utilitas file pada stack2](/images/protostar-stack1-1.png)

Tidak berbeda dengan stack0 dan stack1. Sekarang mari kita lihat source codenya.

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv)
{
  volatile int modified;
  char buffer[64];
  char *variable;

  variable = getenv("GREENIE");

  if(variable == NULL) {
      errx(1, "please set the GREENIE environment variable\n");
  }

  modified = 0;

  strcpy(buffer, variable);

  if(modified == 0x0d0a0d0a) {
      printf("you have correctly modified the variable\n");
  } else {
      printf("Try again, you got 0x%08x\n", modified);
  }

}
```

Setelah diperhatikan source code dari stack2 ini tidak jauh berbeda dengan milik [stack1](/belajar-reversing-protostar-stack1). Pembeda diantara keduanya terletak pada nilai modified yang diminta (0x0d0a0d0a) dan pada bagian input user. Pada stack1 input dimasukkan sebagai argumen sedangkan pada stack2 ini input dimasukkan melalui fungsi **getenv()**. Mari kita lihat dulu apa kegunaan fungsi ini di manual.

```bash
man getenv
```

output :
![menjalankan man getenv](/images/protostar-stack2-2.png)

Berdasarkan manual dari getenv, fungsi ini berguna untuk mencari environment variable dengan nama sama dengan parameter yang diberikan lalu lalu mengembalikann nilai dari environment variable tersebut. Menurut [wikipedia](https://en.wikipedia.org/wiki/Environment_variable), environment variable adalah **nilai dinamis dinamai** yang mempengaruhi proses berjalan di komputer. Environment variable ini terdapat pada berbagai macam sistem operasi termasuk salah satunya linux, yang menjadi host dari protostar ini. Lanjut membaca pada laman [wikipedia](https://en.wikipedia.org/wiki/Environment_variable) untuk menampilkan seluruh environment variable pada os linux dapat menggunakan perintah `env`. Mari kita lihat apakah variable "GREENIE" sudah ada.

```bash
env | grep GREENIE
```

Saya menyaring output env dengan utilitas `grep` agar hanya menampilkan baris dengan kata GREENIE.

output :
![menjalankan env](/images/protostar-stack2-3.png)

Variable name GREENIE tidak ada. Masih pada laman [wikipedia](https://en.wikipedia.org/wiki/Environment_variable) yang sama, untuk melakukan pembuatan environment variable kita dapat menggunakan perintah `export VARIABLE=value`. Mari kita coba buat variable GREENIE dengan value berupa input yang kita gunakan sebelumnya di [stack1](/belajar-revesing-protostar-stack1). Namun mengganti 'dcba' menjadi yang diminta, 0x0d0a0d0a. Berdasarkan `man ascii` 0d = \r, 0a = \n dan jangan lupakan bahwa protostar ialah litle endian.

```bash
export GREENIE=wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww\n\r\n\r
env | grep GREENIE
```

output :
![env](/images/protostar-stack2-4.png)

Ada yang berbeda, '\n' dan '\r' diubah menjadi karakter 'n' dan 'r'. Hal ini sangat mungkin terjadi karena '\n' dan '\r' termasuk special char yang dalam manual ascii '\n' adalah new line dan '\r' ialah carriage ret. Dengan googling saya dapat menemukan jawabannya pada [stackoverflow](https://stackoverflow.com/questions/9139401/trying-to-embed-newline-in-a-variable-in-bash). Mari kita modifikasi dahulu menjadi seperti berikut.

```bash
export GREENIE=wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww$'\n'$'\r'$'\n'$'\r'
env | grep GREENIE
```

Lalu kita coba jalankan executablenya.

```bash
./stack2
```

output :
![env](/images/protostar-stack2-5.png)

Berhasil!
