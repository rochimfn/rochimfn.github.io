---
layout: post
title: "Homelab: Monitoring IBM DB2 dengan Prometheus dan Grafana"
date: 2024-03-04 21:38:49 +0700
categories: [db2, prometheus, grafana]
---

## Menyiapkan Server DB2
Seperti biasanya kita akan menggunakan [multipass](https://multipass.run/) untuk menyiapkan virtual machine ubuntu. Gunakan perintah berikut untuk membuat virtual machine ubuntu jammy dengan jumlah core 2, memory 4G, dan disk 10G.
```bash
multipass launch jammy --name db2-instance -c 2 -m 4G -d 10G
```

Masuk ke virtual machine.
```bash
multipass shell db2-instance
```

Lakukan upgrade package.
```bash
sudo apt update && sudo apt upgrade -y
```

IBM menyediakan DB2 [community edition](https://www.ibm.com/docs/en/db2/11.5?topic=deployments-db2-community-edition-docker) yang dapat dipasang dengan mudah menggunakan docker. Pasang docker dengan perintah berikut.

```bash
sudo apt install docker.io docker-compose
```

Sebelum menggunakan docker, daftarkan user kedalam group docker agar bisa menggunakan docker tanpa sudo.

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```

Logout dulu dari shell agar group tereload.
```bash
exit
```
```bash
multipass shell db2-instance
```

Nyalakan service docker saat startup.
```bash
sudo systemctl enable docker.service
sudo systemctl enable containerd.service
```

Saya telah menyediakan template docker-compose yang dapat digunakan untuk menjalankan DB2. Gunakan perintah berikut untuk clone repository template saya.

```bash
git clone https://github.com/rochimfn/compose-collection.git
```

Buat dahulu network yang dibutuhkan.
```bash
docker network create database
```

Jalankan DB2.
```bash
cd compose-collection/db2
docker-compose up -d
```

Gunakan database client pilihan untuk mencoba koneksi ke db2. Berikut contoh koneksi db2 menggunakan [dbeaver](https://dbeaver.io/).
![Tes koneksi DB2 DBeaver](/images/db2-dbeaver-test-connection.png)

* Driver: Db2 for LUW
* Host: 10.248.34.126 (gunakan `ip a` atau `multipass list` untuk mendapatkan ip)
* Database: testdb
* Username: db2inst1
* Password: password

## Menyiapkan DB2 Exporter

Exporter berfungsi untuk mengambil data metrics dari DB2 dan mengeksposenya dalam bentuk http API yang dapat discrap oleh prometheus. Gunakan perintah berikut untuk membuat virtual machine ubuntu jammy ukuran standar (1 core, 1G memory, 5G disk).
```bash
multipass launch jammy --name db2-exporter
```

Masuk ke virtual machine.
```bash
multipass shell db2-exporter
```

Lakukan upgrade package.
```bash
sudo apt update && sudo apt upgrade -y
```

Pasang package `build-essential` untuk mempermudah proses build exporter.
```bash
sudo apt install build-essential -y
```

Pasang golang dengan mengikuti [dokumentasi](https://go.dev/doc/install).
```bash
sudo su
wget -c https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
exit
```

Restart shell untuk memastikan golang terpasang dengan benar.
```bash
exit
```
```bash
multipass shell db2-exporter
```

Cek versi golang pastikan tidak ada error dan golang menampilkan versi `go version go1.22.0 linux/amd64`.

```bash
go version
```

Selanjutnya pasang driver IBM DB2 versi golang.
```bash
. /etc/profile
go install github.com/ibmdb/go_ibm_db/installer@v0.4.5
cd go/pkg/mod/github.com/ibmdb/go_ibm_db@v0.4.5/installer/
go run setup.go 
export CGO_LDFLAGS=-L/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/lib
export CGO_CFLAGS=-I/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/include
export IBM_DB_HOME=/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver
export LD_LIBRARY_PATH=/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/lib:
export PATH=$PATH:/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/bin
cd
```

Ikuti petunjuk dihalaman [berikut](https://github.com/ibmdb/go_ibm_db) jika terjadi kegagalan pemasangan.

Kita akan menggunakan [DB2 prometheus exporter](https://github.com/grafana/ibm-db2-prometheus-exporter.git) dari grafana. Gunakan perintah berikut untuk proses build

```bash
git clone https://github.com/grafana/ibm-db2-prometheus-exporter.git
cd ibm-db2-prometheus-exporter
make exporter
```

Pastikan exporter sukses terbuild.
```bash
bin/ibm_db2_exporter -h
```

![exporter menampilkan bantuan](/images/db2-monitoring-exporter-help.png)

## Menyiapkan Prometheus

Gunakan perintah berikut untuk membuat virtual machine ubuntu jammy.
```bash
multipass launch jammy --name db2-prometheus
```

Masuk ke virtual machine.
```bash
multipass shell db2-prometheus
```

Lakukan upgrade package.
```bash
sudo apt update && sudo apt upgrade -y
```

Prometheus sudah tersedia di repository ubuntu. Gunakan perintah berikut untuk memasang.
```bash
sudo apt install prometheus -y
```

Gunakan perintah berikut untuk memeriksa service prometheus (gunakan q untuk keluar).
```bash
sudo systemctl status prometheus
```

![contoh luaran status service prometheus](/images/db2-monitoring-prometheus-systemctl-status.png)

## Menyiapkan Grafana
Gunakan perintah berikut untuk membuat virtual machine ubuntu jammy.
```bash
multipass launch jammy --name db2-grafana
```

Masuk ke virtual machine.
```bash
multipass shell db2-grafana
```

Lakukan upgrade package.
```bash
sudo apt update && sudo apt upgrade -y
```

Grafana menyediakan repository khusus untuk pemasangan grafana di ubuntu. Anda dapat membacanya di link berikut [https://grafana.com/docs/grafana/latest/setup-grafana/installation/debian/](https://grafana.com/docs/grafana/latest/setup-grafana/installation/debian/). Secara garis besar, berikut adalah perintah-perintah yang harus dijalankan untuk memasang grafana versi oss.

```bash
sudo apt install -y apt-transport-https software-properties-common wget
sudo mkdir -p /etc/apt/keyrings/
wget -q -O - https://apt.grafana.com/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null
echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee -a /etc/apt/sources.list.d/grafana.list
sudo apt update && sudo apt install grafana -y
```

Gunakan perintah berikut untuk mengaktifkan dan menjalankan service grafana.
```bash
sudo systemctl enable --now grafana-server.service
```

Periksa status service grafana.
```bash
sudo systemctl status grafana-server
```
![contoh luaran status service grafana](/images/db2-monitoring-grafana-systemctl-status.png)


## Menyambungkan Seluruh Komponen
### Mengaktifkan database 
Database DB2 yang akan dimonitor harus diaktifkan secara manual sesuai arahan pada dokumentasi [ibm-db2-prometheus-exporter](https://github.com/grafana/ibm-db2-prometheus-exporter?tab=readme-ov-file#prerequisites).

Masuk pada virtual machine server DB2.
```bash
multipass shell db2-instance
```
Masuk ke container server DB2.
```bash
docker exec -it  db2server /bin/bash
```
Berpindah ke user db2inst1.
```bash
su - db2inst1
```
Jalankan perintah berikut secara berurutan.
```bash
db2
activate database testdb
quit
```
![contoh aktivasi database db2](/images/db2-activate-database.png)

### Mengonfigurasi eksporter
Setelah sukses aktivasi database mari berpindah ke konfigurasi eksporter. Pertama masuk dulu ke virtual machine server eksporter.
```bash
multipass shell db2-exporter
```

Konfigurasi koneksi lewat environment variables.
```bash
export IBM_DB2_EXPORTER_DSN="DATABASE=testdb;HOSTNAME=10.248.34.126;PORT=50000;UID=db2inst1;PWD=password;"
export IBM_DB2_EXPORTER_DB="testdb"
export CGO_LDFLAGS=-L/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/lib
export CGO_CFLAGS=-I/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/include
export IBM_DB_HOME=/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver
export LD_LIBRARY_PATH=/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/lib:
export PATH=$PATH:/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/bin
```
Jalankan exporter secara manual.
```bash
ibm-db2-prometheus-exporter/bin/ibm_db2_exporter
```
Jika tidak ada error, kunjungi IP:9953/metrics di browser untuk melihat matrics yang di expose oleh eksporter. Ganti IP dengan nilai IP dari virtual machine exporter yang bisa didapatkan melalui perintah `ip a` atau `multipass list`.

![contoh matrics luaran ibm_db2_exporter](/images/db-example-exporter-matrics.png)

Mari membuat systemd user service agar proses nyala, mati, dan restart exporter lebih mudah dilakukan. Pertama buat direktori systemd service.
```bash
mkdir -p ~/.config/systemd/user
```
Buat file service.
```bash
vim ~/.config/systemd/user/ibm-db2-exporter.service
```
Tempelkan definisi service berikut. Simpan.
```ini
[Unit]
Description=Service to manage ibm_db2_exporter

[Service]
Type=simple
StandardOutput=journal
Environment="IBM_DB2_EXPORTER_DSN="DATABASE=testdb;HOSTNAME=10.248.34.126;PORT=50000;UID=db2inst1;"PWD=password;"
Environment="IBM_DB2_EXPORTER_DB="testdb""
Environment="CGO_LDFLAGS=-L/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/lib"
Environment="CGO_CFLAGS=-I/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/include"
Environment="IBM_DB_HOME=/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver"
Environment="LD_LIBRARY_PATH=/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/lib:"
Environment="PATH=$PATH:/home/ubuntu/go/pkg/mod/github.com/ibmdb/clidriver/bin"
ExecStart=/home/ubuntu/ibm-db2-prometheus-exporter/bin/ibm_db2_exporter

[Install]
WantedBy=default.target
```

Validasi file service dengan perintah berikut.
```bash
systemd-analyze --user verify .config/systemd/user/ibm-db2-exporter.service
```

Perbaiki jika ada error. Jika tidak ada, jalankan service dengan perintah berikut.
```bash
systemctl --user start ibm-db2-exporter.service
```

Gunakan perintah berikut untuk memeriksa status service.
```bash
systemctl --user status ibm-db2-exporter.service
```

![contoh luaran status service exporter](/images/db2-exporter-service-status.png)

Periksa juga luaran IP:9953/metrics di browser.

Terakhir jalankan perintah berikut agar service langsung berjalan saat OS dijalankan.
```bash
sudo loginctl enable-linger $USER
systemctl --user enable ibm-db2-exporter.service
```

### Mengonfigurasi prometheus

Masuk ke virtual machine prometheus dengan perintah berikut.
```bash
multipass shell db2-prometheus 
```

Buka file konfigurasi prometheus dengan teks editor pilihan.
```bash
sudo vim /etc/prometheus/prometheus.yml 
```

Tambahkan konfigurasi berikut dibagian paling bawah file. Jangan lupa menyesuaikan nilai ip 10.248.34.88.
```yaml
  - job_name: 'db2-testdb'

    scrape_interval: 5s
    scrape_timeout: 5s
    
    static_configs:
      - targets: ['10.248.34.88:9953']
```

![contoh konfigurasi prometheus](/images/db2-konfigurasi-prometheus-db2.png)

Nyalakan ulang prometheus untuk menerapkan konfigurasi.
```bash
sudo systemctl restart prometheus
```

Kunjungi IP:9090/classic/targets di browser untuk melihat status scrape prometheus. Jangan lupa menyesuaikan nilai IP.

![halaman targets prometheus](/images/db2-prometheus-target.png)

*db2-testdb* akan muncul sebagai salah satu target. Pastikan nilai State-nya UP.

### Mengonfigurasi grafana

Masuk ke dashboard grafana di IP:3000 melalui browser. Gunakan username `admin` dan password `admin`.

![halaman login grafana](/images/db2-login-page-grafana.png)

Ganti password sesuai kebutuhan. Jika sudah diganti, masuk ke menu *Connection* > *Add new connection* pada sidebar.

![menu add new connection](/images/db2-grafana-menu-add-connection.png)

Cari dan pilih Prometheus. Tekan tombol *Add new data source*.

![prometheus connection](/images/db2-grafana-prometheus-add-connection.png)

Ganti Name menjadi *db2-prometheus* dan Prometheus server URL dengan http:IP:9090, jangan lupa menyesuaikan nilai IP.

![prometheus data source configuration](/images/db2-grafana-prometheus-configuration.png)

Tekan *Save & test* dan pastikan koneksi sukses.

![prometheus data source configuration test connection](/images/db2-grafana-prometheus-test-connection.png)

Bukan menu *Explore* pada sidebar untuk eksplorasi data pada prometheus.
![grafana query exploration](/images/db2-grafana-query-exploration.png)


### Tambahan: Dashboard grafana

Sayang sekali tidak ada dashboard DB2 Prometheus siap pakai di [galery grafana](https://grafana.com/grafana/dashboards/). Beruntung pada laman [ini](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-ibm-db2/) terdapat contoh dashboard yang dapat ditiru dengan mudah. Berikut hasil tiruan yang saya buat.


![tiruan dashboard grafana db2 prometheus 1](/images/db2-grafana-example-dashboard-1.png)

![tiruan dashboard grafana db2 prometheus 2](/images/db2-grafana-example-dashboard-2.png)

### Tambahan: Memasang Alert

Pada menu sidebar buka *Alerting* > *Contact points*.

![menu contact point grafana](/images/db2-alerting-menu-contact-point.png)

Tekan tombol *+ Add contact point*.

![tombol add contact point](/images/db2-grafana-add-contact-point-button.png)

Kita akan menggunakan [Discord](https://discord.com/) sebagai tempat notifikasi. Alert grafana menggunakan fitur webhooks untuk mengirim notifikasi. Ikuti petunjuk pada [halaman ini](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) untuk mengonfigurasi webhook.

Isi kolom *Name* dengan "Discord Alert Notification" (nama bebas). Pilih "Discord" pada bagian *Integration*. Tempelkan webhook ke kolom "Webhook URL". Tekan *Test* lalu *Send test notification*.

![integrasi contact point](/images/db2-contact-point-integration.png)

Jika semua normal maka alert akan terkirim di discord.

![notifikasi alert discord](/images/db2-grafana-discord-notification.png)

![pesan alert di discord](/images/db2-test-message-alert-discord.png)

Tekan *Save contact point* untuk menyimpan.

Buka menu sidebar pilih menu *Alert rules*. Tekan tombol *New alert rule*.

![menu alert rule](/images/db2-grafana-menu-alert-rule.png)

Isi section *1. Enter alert rule name* kolom *Name* dengan "DB2 is down" (nama bebas). Isi section *2. Define query and alert condition* kolom *Metric* dengan metric *ibm\_db2\_up*.

![konfigurasi alert rule 1](/images/db2-grafana-alert-rule-1.png)

Geser ke bagian bawah, pada bagian *Threshold* ganti *IS ABOVE* menjadi *IS BELOW* dengan nilai 1.

![konfigurasi alert rule 1](/images/db2-grafana-alert-rule-2.png)

Geser ke bagian bawah, pada section *3. Set evaluation behavior* buat *New Folder* dengan isi bebas. Pada bagian *Evaluation order* buat baru dengan *Evaluation group name* bebas dan *Evaluation interval* "10s". Pada kolom *Pending period* isi dengan "15s".

![konfigurasi alert rule 3](/images/db2-grafana-alert-rule-3.png)

Geser ke bagian bawah, pada section *4. Add annotations* isi *Summary (optional)* dengan pesan *DB2 is down*. Hapus labels pada section *5. Labels and notifications*. Tekan *Save rule and exit*.

![konfigurasi alert rule 4](/images/db2-grafana-alert-rule-4.png)

Buka menu sidebar pilih menu *Notification policies*. Tekan tombol titik tiga (...) pada bagian paling kanan baris *Default policy*. Tekan tombol *Edit*.

![konfigurasi notification policies](/images/db2-grafana-notification-policies.png)

Ganti nilai *Default contact point* menjadi "Discord Alert Notification". Tekan *Update default policy*.

![konfigurasi contact point pada default policy](/images/db2-grafana-notification-policies-change-default.png)

Terakhir coba matikan virtual machine server DB2 untuk menguji alert.
```bash
multipass stop db2-instance
```

Setelah beberapa saat alert DB2 is down akan dikirimkan.

![notifikasi alert discord](/images/db2-grafana-alert-discord-example.png)

![isi alert discord](/images/db2-grafana-alert-discord-message-example.png)

**Selesai**