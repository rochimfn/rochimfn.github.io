---
layout: post
title:  "Memasang LAMP Stack di Ubuntu 18.04 Bionic Beaver beserta phpMyAdmin"
date:   2019-08-27 19:21:03 +0700
categories: [ubuntu]
---

LAMP merupakan sebuah singkatan untuk Linux, Apache, Mariadb(atau Mysql), dan PHP. LAMP merupakan kombinasi yang paling sering dipakai untuk membangun web server sederhana di sistem operasi berbasis GNU/Linux. Biasanya untuk mempermudah penngaturan database ditambahkan phpMyAdmin, utillity tambahan yang berguna untuk memudahkan manajemen database mariadb.

### Memasang Apache
```bash
sudo apt install apache2
```
Buka [http://localhost/](http://localhost/) dibrowser untuk melihat apakah apache2 sukses terpasang.

### Mengaktifkan ufw
ufw merupakan simple firewall yang tersedia secara default di Ubuntu
```bash
sudo ufw enable
sudo ufw status
```
Mengizinkan apache di ufw
```bash
sudo ufw allow in "Apache Full"
```

### Memasang gufw
gufw merupakan ufw berbasis GUI untuk memudahkan pengaturan ufw yang berbasis cli.
```bash
sudo apt install gufw
```

### Memasang dan konfigurasi Mariadb
```bash
sudo apt install mariadb-server mariadb-client
sudo mysql_secure_installation
```

![Screenshot mysql_secure_installation](/images/ssmariadb.png)
Tekan enter dua kali. Masukkan password lalu tekan enter. Masukkan password lagi dan tekan enter. Selanjutnya tekan enter terus hingga `mysql_secure_installation` keluar.

### Memasang PHP
PHP yang tersedia di repository Ubuntu Bionic ialah versi 5.6 dan 7.2 untuk memasang versi 7.2 masukkan perintah :

```bash
sudo apt install php php-common php-mysql php-gd php-cli
```

### Memasang phpMyAdmin dan konfigurasi
Masukkan perintah : 

```bash
sudo apt install phpmyadmin
```
Saat muncul opsi diminta memilih tekan tombol space dan tekan enter.
![Screenshot pemasangan phpMyAdmin](/images/ssphpma.png)

Tekan enter jika muncul permintaan untuk memilih atau mengisi password.

![Screenshot pemasangan phpMyAdmin](/images/ssphpma2.png)

Selanjutnya konfigurasi akun untuk phpMyAdmin

```bash
sudo mysql -u root -p

```
```sql
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
\q
```

Buka [http://localhost/phpmyadmin](http://localhost/phpmyadmin) untuk mengakses phpMyAdmin dengan username "admin" dan password "password".

Selesai, LAMP Stack telah terinstall beserta dengan phpMyAdmin. Directory root untuk LAMP Stack ini berada pada `/var/www/html`.