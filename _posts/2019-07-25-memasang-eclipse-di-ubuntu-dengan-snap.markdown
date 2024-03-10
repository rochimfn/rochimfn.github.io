---
layout: post
title:  "Memasang Eclipse IDE terbaru di Ubuntu 18.04 dengan snap"
date:   2019-07-25 18:22:38 +0700
categories: [java,ubuntu]
---
Eclipse merupakan IDE (Integrated Development Environment) yang sangat populer dalam pengembangan program - program berbasis `java`. Pada OS Ubuntu 18.04, Eclipse IDE sudah tersedia di repository resmi. Namun versi yang tersedia sudah usang, untuk memasang yang terbaru dapat dipasang dengan mudah melalui `snap` sebuah manajemen paket yang dikembangkan `canonical`, perusahaan dibalik pengembangan Ubuntu. Snap ini memiliki banyak fitur salah satunya adalah auto update, cukup sambungkan ke internet maka aplikasi yang dipasang dengan akan diupdate secara otomatis. Cukup gunakan perintah berikut

```bash
snap install eclipse --classic
```

Sebelum menjalankan Eclipse pastikan [Openjdk](/memasang-openjdk-11-ubuntu/) telah terpasang.

![Eclipse ide](/images/eclipse-1.png)

Selain Eclipse masih ada lagi IDE java yang juga sangat populer yaitu `IntelliJ IDEA` dan `Apache NetBeans`. Kedua IDE ini juga bisa diinstall dengan mudah di Ubuntu Bionic dengan snap.


#### IntelliJ IDEA
Gunakan perintah berikut untuk memasang IntelliJ IDEA

```bash
snap install intellij-idea-ultimate --classic
snap install intellij-idea-community --classic
snap install intellij-idea-educational --classic
```

* **IntelliJ IDEA Ultimate** ialah IntelliJ IDEA versi berbayar namun memiliki fitur yang paling lengkap.
* **IntelliJ IDEA Community** ialah IntelliJ IDEA versi community yang dapat digunakan tanpa perlu membayar namun dengan fiturnya tidak selengkap versi Ultimate.
* **IntelliJ IDEA Educational** ialah IntelliJ IDEA Community yang ditambahkan plugin khusus pembelajaran.

#### NetBeans
```bash
snap install netbeans --classic
```

**Done**
