---
layout: post
title: "Homelab: Postgresql HA dengan patroni dan zookeeper"
date: 2023-12-17 17:33:49 +0700
categories: [postgresql, ubuntu]
---

## Menyiapkan ZooKeeper Cluster.
Mari kita mulai dengan zookeeper cluster. Kita akan menggunakan [multipass](https://multipass.run/) untuk mengelola virtual machine yang dibutuhkan. 

Jalankan perintah berikut untuk membuat 3 vm ubuntu edisi jammy.
```bash
multipass launch jammy --name zookeeper-1
multipass launch jammy --name zookeeper-2
multipass launch jammy --name zookeeper-3
```

Jalankan perintah `multipass list` untuk melihat status vm dan ip dari setiap vm.
![output multipass list](/images/postgresha-zookeeper-multipass-list.png)

Pasang paket `zookeeperd` di tiga vm (zookeeper-1, zookeeper-2, zookeeper-3). Kita bisa masuk ke vm multipass dengan menjalankan perintah `multipass shell {namavm}`. Gunakan tiga terminal agar tidak perlu keluar masuk vm.

Terminal 1:
```bash
multipass shell zookeeper-1
sudo apt update && sudo apt install zookeeperd -y
```
Terminal 2:
```bash
multipass shell zookeeper-2
sudo apt update && sudo apt install zookeeperd -y
```
Terminal 3:

```bash
multipass shell zookeeper-3
sudo apt update && sudo apt install zookeeperd -y
```

> Catatan: Gunakan mirror repository terdekat untuk mempercepat proses download.


Anggota zookeeper cluster wajib memiliki id unik dengan nilai antara 1-255. Id unik ini perlu diatur di berkas *myid*. Pada ubuntu jammy, berkas ini tersimpan di `/etc/zookeeper/conf/myid`. Berikan id `1` untuk node zookeeper-1, id `2` untuk zookeeper-2, dan `3` untuk zookeeper-3.

```bash
echo {id} | sudo tee /etc/zookeeper/conf/myid
```
![output zookeeper set myid](/images/postgresha-zookeeper-myid.png)

Langkah selanjutnya adalah [menghubungkan setiap node zookeeper](https://zookeeper.apache.org/doc/current/zookeeperStarted.html#sc_RunningReplicatedZooKeeper) menjadi satu cluster. Buka file `/etc/zookeeper/conf/zoo.cfg` dengan `nano` atau `vim` (wajib menggunakan `sudo`).

```bash
sudo vim /etc/zookeeper/conf/zoo.cfg
```

Cari baris konfigurasi berikut:
```bash
#server.1=zookeeper1:2888:3888
#server.2=zookeeper2:2888:3888
#server.3=zookeeper3:2888:3888
```

Ubah menjadi
```bash
server.1=zookeeper-1.multipass:2888:3888
server.2=zookeeper-2.multipass:2888:3888
server.3=zookeeper-3.multipass:2888:3888
```

Sesuaikan nilai `zookeeper-1`, `zookeeper-2`, `zookeeper-3` dengan hostname atau ip dari setiap node.

![output zookeeper set myid](/images/postgresha-zookeeper-zoocfg.png)


Nyalakan ulang service zookeeper pada setiap node. Pastikan seluruh node menujukkan status **CONNECTED** ketika diuji coba cengan `zkCli.sh`
```bash
sudo systemctl stop zookeeper.service 
sudo systemctl start zookeeper.service
sudo /usr/share/zookeeper/bin/zkCli.sh 
```

> Status **CONNECTING** pada `zkCli.sh` menujukkan adanya kesalahan pada node zookeeper. Lakukan debugging dengan membaca log zookeeper di `/var/log/zookeeper/zookeeper.log`.


## Menyiapkan Node Postgres.

Jalankan perintah berikut untuk membuat 3 vm untuk server postgresql.
```bash
multipass launch jammy --name postgresql-1
multipass launch jammy --name postgresql-2
multipass launch jammy --name postgresql-3
```

![multipass list](/images/postgresha-postgres-multipass.png)

Pasang postgresql-server di seluruh node postgres.

Terminal 4:
```bash
multipass shell postgresql-1
sudo apt update && sudo apt install postgresql -y
```
Terminal 5:
```bash
multipass shell postgresql-2
sudo apt update && sudo apt install postgresql -y
```
Terminal 6:

```bash
multipass shell postgresql-3
sudo apt update && sudo apt install postgresql -y
```

Matikan service postgresql di seluruh node postgres.
```bash
sudo systemctl stop postgresql
```


## Menyiapkan Patroni.

Pasang patroni dengan menjalankan perintah berikut di tiga node postgres (postgresql-1, postgresql-2, postgresql-3).

```bash
sudo apt install patroni python3-kazoo -y 
```

Buat direktori untuk menyimpan database files di tiga node postgres.

```bash
sudo mkdir -p /data/patroni
sudo chown postgres:postgres /data/patroni
sudo chmod 700 /data/patroni 
```


Selanjutnya buat berkas `/etc/patroni/config.yml` pada tiga node postgres dengan isi sebagai berikut.

```yaml
scope: postgres-multipass-0
namespace: /postgres-multipass-0/
name: postgresql-1

restapi:
  listen: 10.89.131.213:8008
  connect_address: 10.89.131.213:8008

zookeeper:
  hosts: ['10.89.131.56:2181', '10.89.131.132:2181', '10.89.131.151:2181']

bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576
    postgresql:
      use_pg_rewind: true
      pg_hba:
      - host replication replicator 127.0.0.1/32 md5
      - host replication replicator 10.89.131.213/0 md5
      - host replication replicator 10.89.131.29/0 md5
      - host replication replicator 10.89.131.5/0 md5
      - host all all 0.0.0.0/0 md5
      parameters:

  initdb:
  - encoding: UTF8
  - data-checksums

postgresql:
  listen: 10.89.131.213:5432
  connect_address: 10.89.131.213:5432

  data_dir: /data/patroni
  bin_dir: /usr/lib/postgresql/14/bin
  pgpass: /tmp/pgpass0
  authentication:
    replication:
      username: replicator
      password: replicator
    superuser:
      username: postgres
      password: postgres
    rewind:
      username: rewind_user
      password: rewind_password
  parameters:
    unix_socket_directories: '.'

tags:
    nofailover: false
    noloadbalance: false
    clonefrom: false
    nosync: false
```

Sesuaikan nilai-nilai berikut
* Ubah nilai `name` dengan identitas unik node
* Ubah nilai ip `restapi.listen` dan `restapi.connect_address` dengan ip dari node
* Ubah nilai ip `zookeeper.hosts` dengan daftar ip dari zookeeper cluster
* Tambahkan ip seluruh node postgresql/patroni ke `bootstrap.dcs.postgresql.pg_hba`
* Ubah nilai ip `postgresql.listen` dan `postgresql.connect_address` dengan ip dari node
* Ubah nilai versi postgresql di `postgresql.bin_dir` (14 di jammy)

Jalankan patroni disetiap node postgresql.
```bash
sudo systemctl start patroni
```

Pastikan service patroni berjalan di setiap node.
```bash
sudo systemctl status patroni
```

Pastikan juga seluruh node postgresql terdaftar sebagai anggota cluster dengan menjalankan perintah berikut disalah satu node.
```bash
patronictl -c /etc/patroni/config.yml list
```
![luaran patronictl list](/images/postgresha-list-member.png)

> Perintah `journalctl -xeu patroni` dapat digunakan untuk melihat log (debugging) service patroni.

## Menguji Replikasi.

Buat database baru pada leader dari cluster. Gunakan password sesuai konfigurasi `postgresql.authentication.superuser.password` saat diminta.

```bash
psql -h 10.89.131.213 -U postgres -c 'CREATE DATABASE testdb'
```

Pastikan database terbentuk juga pada postgres follower
```bash
psql -h 10.89.131.29 -U postgres -c 'SELECT datname FROM pg_database;'
psql -h 10.89.131.5 -U postgres -c 'SELECT datname FROM pg_database;'
```

## Menguji Failover.

Matikan service patroni pada node leader.
```bash
sudo systemctl stop patroni
```

Pastikan posisi leader berubah ke node lain.
```bash
patronictl -c /etc/patroni/config.yml list
```

![luaran patronictl list setelah node leader dimatikan](/images/postgresha-list-member-failover.png)

Nyalakan ulang service patroni.
```bash
sudo systemctl start patroni
```

Pastikan node kembali lagi menjadi anggota cluster sebagai member.
```bash
patronictl -c /etc/patroni/config.yml list
```

![luaran patronictl list setelah node dinyalakan ulang](/images/postgresha-rejoin-cluster.png)

Pergantian leader dapat dilakukan secara manual dengan menjalankan `switchover`.

```bash
patronictl -c /etc/patroni/config.yml switchover
```

![luaran perintah switchover](/images/postgresha-manual-switchover.png)


## Menyiapkan Haproxy.

Sekarang postgresql kita terbagi menjadi dua yaitu leader yang dapat menerima akses read write dan follower yang hanya bisa menerima akses read only. Masalahnya, saat terjadi proses switchover posisi node leader dapat berubah menjadi follower. Aplikasi yang memerlukan read write akan mengalami error karena terkoneksi ke node follower. Haproxy (load balancer) dapat digunakan untuk menyelesaikan masalah ini. Aplikasi cukup terkoneksi ke haproxy dan haproxy yang akan bertanggung jawab merutekan koneksi ke node yang sesuai.

Jalankan perintah berikut untuk membuat vm ubuntu untuk haproxy.
```bash
multipass launch jammy --name haproxy-1
```
> Single node haproxy adalah *Single Point of Failure*. Hindari single node haproxy di lingkungan production.

![multipass list](/images/postgresha-multipass-list-haproxy.png)

Pasang haproxy di node `haproxy-1`.
```bash
sudo apt update && sudo apt install haproxy -y
```

Matikan service haproxy.
```bash
sudo systemctl stop haproxy
```

Backup default konfigurasi haproxy.
```bash
sudo cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.original
```

Tambahkan konfigurasi berikut dibagian bawah `/etc/haproxy/haproxy.cfg`. Jangan lupa sesuaikan nilai ip dari cluster postgresql. 
```lua
listen stats
    mode http
    bind *:7000
    stats enable
    stats uri /

listen pg_rw
    mode tcp
    bind *:5432
    option httpchk
    http-check expect status 200
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server postgresql-1 10.89.131.213:5432 maxconn 100 check port 8008
    server postgresql-2 10.89.131.29:5432 maxconn 100 check port 8008
    server postgresql-3 10.89.131.5:5432 maxconn 100 check port 8008

listen pg_ro
    mode tcp
    bind *:5433
    option httpchk
    http-check expect status 503
    default-server inter 3s fall 3 rise 2 on-marked-down shutdown-sessions
    server postgresql-1 10.89.131.213:5432 maxconn 100 check port 8008
    server postgresql-2 10.89.131.29:5432 maxconn 100 check port 8008
    server postgresql-3 10.89.131.5:5432 maxconn 100 check port 8008
```

Konfigurasi diatas menambahkan 3 entry yaitu stats, pg\_rw, dan pg\_ro. stats berfungsi mengembalikan halaman statistics haproxy di port 7000. pg\_rw menerima koneksi postgres di port 5432 dan meneruskannya ke node leader. pg\_ro menerima koneksi di port 5433 dan meneruskannya ke node follower. Jalankan ulang service haproxy.
```bash
sudo systemctl restart haproxy.service 
```

Buka `http://10.89.131.49:7000/` (ip haproxy) untuk melihat statistics dari haproxy. Pada bagian pg\_rw haproxy akan menunjukkan status node leader terkini, ditandai dengan warna hijau. Pada bagian pg\_ro haproxy akan menujukkan node follower.

![haproxy stats](/images/postgresha-haproxy-stats.png)

Lakukan switchover dan haproxy akan mengupdate status pg\_rw dan pg\_ro.

![haproxy stats after switchover](/images/postgresha-haproxy-stats-switchover.png)

Periksa status koneksi dengan fungsi `pg_is_in_recovery()` melalui port 5432 (pg\_rw) dan 5433 (pg\_ro).
```bash
psql -h 10.89.131.49 -p 5432 -U postgres -c 'SELECT pg_is_in_recovery();'
psql -h 10.89.131.49 -p 5433 -U postgres -c 'SELECT pg_is_in_recovery();'
```
`pg_is_in_recovery()` mengembalikan nilai `t` jika koneksi adalah read only dan `f` jika koneksi adalah read write.


![testing koneksi ke haproxy](/images/postgresha-haproxy-testing.png)

**Selesai**