---
layout: post
title: "Red Hat Enterprise Linux VM on LXD"
date: 2025-04-18 16:20:20 +0700
categories: [rhel,lxd]
---

A few days ago, I took the [Fundamentals of Red Hat Enterprise Linux 9](https://www.coursera.org/learn/fundamentals-of-red-hat-enterprise-linux-9) course on [Coursera](https://www.coursera.org). Naturally, I need to get access to the RHEL 9 environment. Since I already have LXD (and multipass) installed, I choose to install RHEL as a virtual machine on LXD. If you want to follow along, you'll need [LXD prepared](/frappe-development-environment-on-lxd-container/) and a RHEL 9 installation image (I use the DVD image). RHEL provides [no-cost access to RHEL 9 for individual developers](https://developers.redhat.com/articles/faqs-no-cost-red-hat-enterprise-linux), so don't worry about the cost and download the installation image directly from [the Redhat website](https://developers.redhat.com/products/rhel/download). Let's get started.

First, you will need to install the `virt-viewer` package.
```bash
sudo apt update && sudo apt install virt-viewer
```

The `virt-viewer` is necessary to access the gui console of the vm. Next, create an empty vm.
```bash
lxc init rhel9 --vm --empty
```

Create a disk for the root partition of the vm. Here I give it 50G.
```bash
lxc config device override rhel9 root size=50GiB
```

Next, set the size for CPU and memory. Here I give it 4 cores of cpu and 4G of memory.
```bash
lxc config set rhel9 limits.cpu=4 limits.memory=4GiB
```

Next is adding installation media. I store my installation media at `/home/rochim/Downloads/rhel-9.5-x86_64-dvd.iso`.
```bash
lxc config device add rhel9 install disk source=/home/rochim/Downloads/rhel-9.5-x86_64-dvd.iso boot.priority=10
```

![prepare lxd for rhel vm installations](/images/lxd-rhel-prepare.png)

Now we can launch the vm to start the installation process.

```bash
lxc start rhel9 --console=vga
```

LXD will launch the vm and create a new window showing the boot process.

>If you accidentally (or purposefully) close the ui window, you can use `lxc console rhel9 --type=vga` command to launch it again.

![rhel grub](/images/first-boot-rhel9.png)


Choose _Install Red Hat Enterprise Linux 9.x_ on grub and wait until the anaconda installer shows up.

![rhel 9 anaconda installer welcome page](/images/rhel9-anaconda-welcome.png)

Continue the installation process just like installing Fedora OS.

![rhel 9 anaconda summary page before](/images/rhel9-anaconda-summary-1.png)
![rhel 9 anaconda software selection page](/images/rhel9-anaconda-software-selection.png)
![rhel 9 anaconda installation destination page](/images/rhel9-anaconda-installation-destination.png)
![rhel 9 anaconda create user page](/images/rhel9-anaconda-create-user.png)
![rhel 9 anaconda summary page after](/images/rhel9-anaconda-summary-2.png)

Begin Installation.

![rhel 9 anaconda installation process](/images/rhel9-anaconda-installation-process.png)
![rhel 9 anaconda installation done](/images/rhel9-anaconda-installation-done.png)

Click on the Reboot System button and the ui window will automatically close. Don't worry, you can launch the ui window again with the below command.

```bash
lxc console rhel9 --type=vga
```

The problem is, the vm is booting the installation media again (at least on mine). I have to stop the vm and remove the installation media from it.

```bash
lxc stop rhel9
lxc config device remove rhel9 install
```

After that, I can launch the vm and it will boot the root disk.

```bash
lxc start rhel9 --console=vga
```

![rhel 9 gdm](/images/rhel9-gdm.png)

You can also access the vm through ssh. Get the ip from the `lxc list` output and ssh directly into it.
```bash
lxc list
ssh user@ip
```

![ssh into rhel 9 on lxd](/images/rhel9-ssh-into.png)

Now you can [register the subscription](https://access.redhat.com/articles/1378093) for your installation and you're good to go. Thank you and see you later.