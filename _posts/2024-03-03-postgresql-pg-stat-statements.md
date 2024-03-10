---
layout: post
title: "Homelab: Postgresql pg_stat_statements"
date: 2024-03-03 17:21:49 +0700
categories: [postgresql, ubuntu]
---

## Menyiapkan Server Postgresql.
Kita akan menggunakan [multipass](https://multipass.run/) untuk menyiapkan virtual machine untuk server postgresql. 

Jalankan perintah berikut untuk membuat virtual machine ubuntu edisi jammy.
```bash
multipass launch jammy --name postgresql-stat
```

Masuk ke virtual machine dengan perintah berikut.
```bash
multipass shell postgresql-stat
```

Update repository dan package.
```bash
sudo apt update && sudo apt upgrade -y
```

Pasang postgresql server dengan perintah berikut.
```bash
sudo apt update && sudo apt install postgresql -y
```

Masuk sebagai user `postgres`.
```bash
sudo su - postgres
```

Masuk ke psql.
```bash
psql
```

Gunakan `exit` untuk keluar dari psql dan untuk keluar dari user postgres.

## Memasang pg\_stat\_statements

Buka file postgresql.sql yang berada di `/etc/postgresql/14/main/` sebagai root dengan editor pilihan.
```bash
sudo vim /etc/postgresql/14/main/postgresql.conf
```

Cari konfigurasi `shared_preload_libraries`. Hapus komentar (karakter pagar) didepan konfigurasi dan masukkan `pg_stat_statements` pada konfigurasi. Simpan.
```ini
shared_preload_libraries = 'pg_stat_statements'  # (change requires restart)
```

![contoh konfigurasi shared_preload_libraries di file postgresql.conf](/images/postgresql_konfigurasi_shared_preload_libraries.png)

Restart server postgresql.
```bash
sudo systemctl restart postgresql
```

Masuk sebagai user `postgres`.
```bash
sudo su - postgres
```

Masuk ke psql.
```bash
psql
```

Aktifkan ekstensi pg\_stat\_statements dengan perintah berikut.
```
create extension if not exists pg_stat_statements;
```

View pg\_stat\_statements dan pg\_stat\_statements_info akan tersedia setelah ekstensi diaktifkan.

```sql
-- untuk menyalakan extended display
\x 
-- untuk mematikan pager
\pset pager 0

select * from pg_stat_statements;
```

![contoh pg_stat_statements](/images/postgresql_contoh_pg_stat_statements.png)


Gunakan perintah `exit` untuk keluar psql.

## Tambahan: Membuat simulasi workload dengan pgbench

Sebagai demo fitur pg_stat_statements, kita bisa menggunakan tool pgbench untuk membuat simulasi workload.

Pertama buat database baru untuk pgbench.
```bash
psql -c "create database demo_pgbench"
```

Inisiasi tabel - tabel pgbench ke database baru.
```bash
pgbench -i demo_pgbench
```

Generate workload dengan pgbench.
```bash
pgbench -c 2 -t 100 demo_pgbench
```

![contoh pg_stat_statements setelah pgbench](/images/postgresql_contoh_pg_stat_statements_setelah_pgbench.png)

**Selesai**