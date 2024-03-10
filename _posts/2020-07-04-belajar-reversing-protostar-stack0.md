---
layout: post
title: "Protostar: stack0 "
date: 2020-07-04 18:32:03 +0700
categories: [reversing, protostar]
---

stack0 merupakan level paling awal dari protostar. Challenge ini terdapat pada `/opt/protostar/bin/stack0` bersama dengan berkas untuk level selanjutnya. Pada [halaman resminya](https://exploit-exercises.lains.space/protostar/stack0/) diberikan deskripsi singkat mengenai challenge ini beserta dengan source code dari stack0. Berikut merupakan source codenya

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>

int main(int argc, char **argv)
{
  volatile int modified;
  char buffer[64];

  modified = 0;
  gets(buffer);

  if(modified != 0) {
      printf("you have changed the 'modified' variable\n");
  } else {
      printf("Try again?\n");
  }
}

```

Berdasarkan source code yang diberikan tujuan dari challenge ini ialah untuk mendapatkan output "you have changed the 'modified' variable". Dimana untuk mendapatkan output seperti itu diharuskan untuk mengubah hasil pengecekan dengan mengganti nilai variable modified. Namun sebelumnya terlebih dahulu saya mengecek stack0 dengan utilitas `file` dan didapatkan output sebagai berikut.

![output dari utilitas file pada stack0](/images/protostar-stack0-1.png)

Output menunjukkan bahwa stack0 ialah file executable untuk linux (ELF) 32bit. Seteleh itu mari dianalisis dengan `gdb` yang sudah disediakan.

```bash
gdb -q stack0
dis./imagesisassembly-flavo./images main
```

Baris perintah pertama bertujuan untuk meload stack0 ke gdb dengan argumen tambahan -q yang memberikan instruksi kepada gdb untuk membukanya dalam mode quiet. Baris perintah selanjutnya menginstruksikan gdb untuk mendisassembly fungsi main. Secara default gdb akan menampilkan hasil disassembly dalam syntax att, untuk mengubah ke syntax intel gunakan perintah pada baris ketiga. Berikut merupakan hasil disassembly dengan syntax intel.

![disassembly fungsi main pada stack0](/images/protostar-stack0-2.png)

Pendekatan pertama yang saya lakukan ialah dengan mencoba mengubah nilai dari variable modified menjadi selain 0 pada saat assignment. Namun sayangnya selalu gagal.
Pendekatan selanjutnya yang coba saya lakukan ialah mengubah hasil pengecekan agar alur program mengarah pada yang saya inginkan.

![disassembly fungsi main pada stack0](/images/protostar-stack0-3.png)

Pengecekan dilakukan oleh instruksi **`test`** jika pengecekan menghasilkan 0 (yang dibandingkan sama). Maka `ZF` atau **zero flag** akan bernilai benar dan alur program akan mengarah ke instruksi **`je`**, **jump equal**. Sedangkan jika pengecekan menghasilakan nilai bukan 0 maka ZF bernilai salah dan alur program akan mengarah pada **`jne`**, **jump not equal**, tujuan kita. Lebih lanjut mengenai **`test`** dapat dibaca di [https://stackoverflow.com/questions/13064809/the-point-of-test-eax-eax](https://stackoverflow.com/questions/13064809/the-point-of-test-eax-eax) dan di [wikipedia.org](<https://en.wikipedia.org/wiki/TEST_(x86_instruction)>).

Selain itu perlu diketahui bahwa cara komputer membandingkan nilai ialah dengan melakukan pengurangan kedua nilai tersebut jika menghasilkan 0 maka bernilai sama. Misal terdapat nilai 10 dan 9, 10-9 menghasilkan 1 bukan 0 maka kedua nilai tidak sama dan ZF akan bernilai salah.

### Langkah penyelesaian

Breakpoint saya pasang pada pengecekan oleh test. Menjalankan program, memasukkan input sembarang. Saat program berhenti pada breakpoint yang saya tentukan, saya mengubah nilai eax menjadi 1 dan melanjutkan eksekusi program.

```bash
break* 0x08048415
run
input
set $eax=1
continue
```

![penyelesaian stack0](/images/protostar-stack0-4.png)

Berhasil!.

### Metode penyelesaian lain

Selain dengan pendekatan sebelumnya level ini juga dapat diselesaikan dengan metode lain dengan memanfaatkan fungsi `gets()`. Fungsi `gets()` merupakan fungsi yang berfungsi untuk menerima input dari user lalu menyimpannya pada variable yang menjadi parameter. Namun fungsi ini memiliki celah keamanan dimana fungsi ini tidak melakukan pegecekan panjang input dari user dengan besar variable yang di alokasikan. Alhasil jika besar input yang diberikan lebih besar dari alokasi memori, input akan menimpa isi memori dan mengubah dan merusak alur program. Inilah yang dinamakan **bufferoverflow** input yang diberikan lebih besar dari buffer(besar memori) yang dialokasikan sehingga terjadi overflow pada buffer.

Perhatikan lagi source code dari stack0. Buffer untuk fungsi gets memiliki besar 64 byte. Overflow akan terjadi saat stack0 dijalankan dan diberikan input lebih dari 64 byte. Berikut ketika saya menggunakan huruf w sebanyak 65 sebagai input.

![penyelesaian stack0](/images/protostar-stack0-5.png)

Berhasil!.
