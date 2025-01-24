---
layout: post
title: "Use Vitess as Database for Frappe"
date: 2025-01-21 14:27:00 +0700
categories: [vitess, frappe, lxd]
---

Vitess is highly scalable database compatible with mysql connection. The scalability of Vitess is already proven by a lot of big company. If you want to learn more about Vitess and see who is this "big company", see [https://vitess.io/](https://vitess.io/). 

Frappe is low code web framework powering popular software ERPNext. [In the last  post](/frappe-development-environment-on-lxd-container/), I try to setup frappe development environment inside LXD container. For the next experiment I think it would be cool if I can use Vitess as database for Frappe. Frappe support MariaDB and PostgreSQL as database backend. MariaDB it self is a fork of Mysql. Of course there are feature that is not compatible with each other. But, lets see how far I can go.

## Setup Vitess
I will use LXD container, see [https://canonical.com/lxd/install](https://canonical.com/lxd/install) or my [last  post](/frappe-development-environment-on-lxd-container/) to see how to setup LXD.


Create container for Vitess and Frappe.
```bash
lxc launch ubuntu:24.04 frappe-vitess-experiment -c limits.cpu=2 -c limits.memory=4GiB -d root,size=30GiB
```
Check the state of the newly created container:
```bash
lxc list --fast
```
The *frappe-vitess-experiment* should be RUNNING.

Enter the container:
```bash
lxc shell frappe-vitess-experiment
```

![container root shell](/images/lxc-shell-frappe-vitess-experiment.png)

Update the system:
```bash
apt update && apt upgrade -y
```

Next, I will follow the local installation guide on Vitess documentation (with some adjustment). You can read it [here](https://vitess.io/docs/21.0/get-started/local/).

Install required packages for vitess:
```bash
apt install -y mysql-server etcd-server etcd-client curl
```

Stop and disable mysql and etcd services:
```bash
systemctl stop mysql
systemctl stop etcd
systemctl disable mysql
systemctl disable etcd
```

Login as user ubuntu:
```bash
su - ubuntu
```

Install NVM:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
. .bashrc
```
> Vitess install script want nvm. It will attempt to installed it if nvm is not found.

Disable AppArmor:
```bash
sudo ln -s /etc/apparmor.d/usr.sbin.mysqld /etc/apparmor.d/disable/
sudo apparmor_parser -R /etc/apparmor.d/usr.sbin.mysqld
```

Download vitess:
```bash
version="v21.0"
url="$(curl -s https://api.github.com/repos/vitessio/vitess/releases | jq --arg version "${version}" -r '[.[] | select(.tag_name | contains($version))] | sort_by(.created_at) | reverse | .[0:1] | .[] | .assets[] | select(.content_type | contains("application/gzip")) | .browser_download_url')"
file="${url##*/}"
curl -LO "${url}"

tar -xzf ${file}
cd ${file/.tar.gz/}
sudo mkdir -p /usr/local/vitess
sudo cp -r * /usr/local/vitess/
```

Set path:
```bash
echo 'export PATH=/usr/local/vitess/bin:${PATH}' >> ~/.bashrc
. ~/.bashrc
cd ~
```

Setup example deployment:
```bash
vitess_path=/usr/local/vitess
mkdir ~/my-vitess-example
cp -r ${vitess_path}/{examples,web} ~/my-vitess-example
```

Before starting the server, for some reason the web ui won't work unless the node_modules is reconfigure:
```bash
nvm install 20.12.2
cd ~/my-vitess-example/web/vtadmin
rm -rf node_modules
npm i
```

Init the (single) cluster:
```bash
cd ~/my-vitess-example/examples/local
./101_initial_cluster.sh
```

Wait the script done and the cluster should be up.

![initiate vitess single cluster](/images/initiate-vitess-single-cluster.png)

Unfortunately, the web ui (vtadmin-web) is only accessible from hostname. Open new terminal to find the container ip address:
```bash
lxc list
```

Edit */etc/hosts* file on host machine to register the hostname:
```hosts
10.170.117.218      frappe-vitess-experiment.lxd # lxd hostname -> <name>.lxd
```

The web ui should be accessible by browser at [http://frappe-vitess-experiment.lxd:14201](http://frappe-vitess-experiment.lxd:14201).

![vitess schemas page](/images/vitess-schema-page.png)

Open new terminal and take a snapshot of the container: 
```bash
lxc snapshot frappe-vitess-experiment vitess-working
```

Check the snapshot:
```bash
lxc info frappe-vitess-experiment 
```

![checking snapshot of lxc container](/images/lxc-snapshot-vitess-working.png)

## Setup Bench

I will install the bench inside the same container.

Enter the container:
```bash
lxc shell frappe-vitess-experiment
```

Install the bench prerequisities:
```bash
apt install -y git python-is-python3 python3-dev python3-pip python3.12-venv redis-server xvfb libfontconfig wkhtmltopdf
```
> Don't install mariadb-server

Login as user ubuntu:
```bash
su - ubuntu
```

Install yarn through npm:
```bash
npm install -g yarn
yarn --version ## make sure yarn in path
```

Install bench:
```bash
pip install frappe-bench --break-system-packages
echo 'export PATH=$PATH:/home/ubuntu/.local/bin' >> .bashrc
. .bashrc
bench --version
```

![bench successfully installed](/images/bench-installed.png)

Init frappe bench:
```bash
cd
bench init frappe-bench
cd frappe-bench
bench find .
```

![frappe bench successfully initiated](/images/bench-find-successfully.png)


## Use Vitess to Store Site Data

Here is come the main agenda. First, lets create snapshot of the container and try restore them.

Open new terminal and create snapshot:
```bash
lxc snapshot frappe-vitess-experiment bench-installed
```

Create new random file to verify the snapshot working:
```bash
lxc shell frappe-vitess-experiment
touch should-be-gone
ls # should-be-gone file should be listed
exit
```

Restore using the snapshot:
```bash
lxc restore frappe-vitess-experiment bench-installed
lxc shell frappe-vitess-experiment
ls # should-be-gone file should be ... well gone
```

![lxd restore testing](/images/lxd-restore-testing.png)

The snapshot and restore functionality is working, no need to worry when things screwed. Now, lets try to up and down the Vitess database.

Start up vitess:
```bash
lxc shell frappe-vitess-experiment
su - ubuntu 
cd ~/my-vitess-example/examples/local
./101_initial_cluster.sh
. ../common/env.sh
```
![starting vitess services](/images/startup-vitess.png)

Tear down vitess:
```bash
lxc shell frappe-vitess-experiment
su - ubuntu 
cd ~/my-vitess-example/examples/local
./401_teardown.sh
```
![teardown vitess services](/images/teardown-vitess.png)

Forcefully teardown vitess:
```bash
lxc shell frappe-vitess-experiment
su - ubuntu 
cd ~/my-vitess-example/examples/local
sudo pkill -9 -f '(vtdataroot|VTDATAROOT|vitess|vtadmin)'
rm -rf vtdataroot
```
> Normally force teardown is not needed. Only when there is some stale processes or some strange error.

Start vitess and create new site in frappe:
```bash
lxc shell frappe-vitess-experiment
su - ubuntu 
cd ~/my-vitess-example/examples/local
./101_initial_cluster.sh
. ../common/env.sh

cd  ~/frappe-bench
bench new-site library.test
```

The command will ask for user and password. I don't think I set that up, just hit enter then. Boom! got first error:
```python-traceback
Traceback (most recent call last):
  File "/home/ubuntu/frappe-bench/env/lib/python3.12/site-packages/pymysql/connections.py", line 649, in connect
    sock = socket.create_connection(
           ^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/lib/python3.12/socket.py", line 852, in create_connection
    raise exceptions[0]
  File "/usr/lib/python3.12/socket.py", line 837, in create_connection
    sock.connect(sa)
ConnectionRefusedError: [Errno 111] Connection refused
```

> For now and the rest of post I will only show the relevant part of error. I will provide link to the full traceback for all error at the bottom of the post.

Connection refused means the frappe can't reach the vitess. The default port for mariadb (default bench --db-type) is 3306. The port use by vitess in my deployment is 15306. Looking at `bench new-site --help` there is *--db-port* flag that can be used to spesify the database port. There is also *--no-setup-db* flag to instruct frappe to use existing database and user. By default new-site command will try to create user, create database, which won't work becase vitess [don't support *CREATE USER*](https://vitess.io/docs/21.0/user-guides/configuration-advanced/user-management/).

So we will use below command to create new-site:
```bash
bench new-site library.test --db-port 15306 --db-name commerce --no-setup-db
```
*--db-name* flag is used to spesify the database name. I got *commerce* name from vtadmin under Keyspaces menu. Database in vitess is called keyspace. You can also create another keyspace through vtadmin.

Got another error. The top of traceback:
```python-traceback
Traceback (most recent call last):
  File "/home/ubuntu/frappe-bench/env/lib/python3.12/site-packages/redis/connection.py", line 357, in connect
    sock = self.retry.call_with_retry(
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/ubuntu/frappe-bench/env/lib/python3.12/site-packages/redis/retry.py", line 62, in call_with_retry
    return do()
           ^^^^
  File "/home/ubuntu/frappe-bench/env/lib/python3.12/site-packages/redis/connection.py", line 358, in <lambda>
    lambda: self._connect(), lambda error: self.disconnect(error)
            ^^^^^^^^^^^^^^^
  File "/home/ubuntu/frappe-bench/env/lib/python3.12/site-packages/redis/connection.py", line 730, in _connect
    raise err
  File "/home/ubuntu/frappe-bench/env/lib/python3.12/site-packages/redis/connection.py", line 718, in _connect
    sock.connect(socket_address)
ConnectionRefusedError: [Errno 111] Connection refused
```

Another connection refused. Looking at the traceback, I think now the frappe can't connect to redis. On developer mode, redis is normally spawn by `bench start`. Lets start it on another terminal:
```bash
lxc shell frappe-vitess-experiment
su - ubuntu 
cd  ~/frappe-bench
bench start
```

Lets try to create new-site again with the same command:
```bash
bench new-site library.test --db-port 15306 --db-name commerce --no-setup-db
```

Another error:
```
pymysql.err.OperationalError: (1101, 'target: commerce.0.primary: vttablet: rpc error: code = InvalidArgument desc = BLOB, TEXT, GEOMETRY or JSON column \'content\' can\'t have a default value (errno 1101) (sqlstate 42000) (CallerID: userData1): Sql: "create table tabWorkspace (\\n\\t`name` varchar(140) primary key,\\n\\tcreation datetime(6),\\n\\tmodified datetime(6),\\n\\tmodified_by varchar(140),\\n\\towner varchar(140),\\n\\tdocstatus tinyint not null default \'0\',\\n\\tidx int not null default \'0\',\\n\\tlabel varchar(140) unique,\\n\\ttitle varchar(140),\\n\\tsequence_id decimal(21,9) not null default 0.0,\\n\\tfor_user varchar(140),\\n\\tparent_page varchar(140),\\n\\tmodule varchar(140),\\n\\tapp varchar(140),\\n\\ttype varchar(140) default \'Workspace\',\\n\\tlink_type varchar(140),\\n\\tlink_to varchar(140),\\n\\texternal_link varchar(140),\\n\\ticon varchar(140),\\n\\tindicator_color varchar(140),\\n\\trestrict_to_domain varchar(140),\\n\\thide_custom tinyint not null default 0,\\n\\tpublic tinyint not null default 0,\\n\\tis_hidden tinyint not null default 0,\\n\\tcontent longtext default \'[]\',\\n\\t_user_tags text,\\n\\t_comments text,\\n\\t_assign text,\\n\\t_liked_by text,\\n\\tkey restrict_to_domain (restrict_to_domain),\\n\\tkey public (public),\\n\\tkey creation (creation)\\n) ENGINE InnoDB,\\n  ROW_FORMAT DYNAMIC,\\n  charset utf8mb4,\\n  COLLATE utf8mb4_unicode_ci", BindVars: {}')
```

```
BLOB, TEXT, GEOMETRY or JSON column \'content\' can\'t have a default value
```

Turns out vitess don't support default value for TEXT column. Looking at the sql, the doctype Workspace uses default value for couple of column. And one of the is *content* with type *longtext*. I will take the shortcut and just remove the default value from doctype definition at *~/frappe-bench/apps/frappe/frappe/desk/doctype/workspace/workspace.json*.

![Remove default value from workspace doctype](/images/remove-default-value-from-workspace-doctype.png)

I believe there are a lot of frappe doctype that uses default value on text column type. I don't know which one it is. So, I will just run the new-site command and if I encouter error related to default value error, I will just remove the default value from the doctype definition. I will provide list of the doctype at the bottom of the post.

Got another error:
```
pymysql.err.OperationalError: (1305, 'SAVEPOINT does not exist: release savepoint okjnmqidlv')
```
Vitess can't find the savepoint mentioned. I believe vitess have [support for savepoint](https://github.com/vitessio/vitess/issues/4462). There is an [closed issue](https://github.com/vitessio/vitess/issues/6754) with the same error. Unfortunately there is no solution. I will take another shortcut and just remove the use of savepoint inside the frappe. 

I disable the savepoint functionality by commenting the function body and subtitute it with pass. Savepoint functionality is defined at *apps/frappe/frappe/database/database.py* inside frappe bench. The name of the function is *savepoint*, *release_savepoint*, and *rollback* (only disable when rollback savepoint).

![disable savepoint feature](/images/disable-savepoint-frappe.png)

Got another error.
```
pymysql.err.OperationalError: (1105, "syntax error at position 16 near 'sequence'")
```

Looks like it fails when trying to create sequence. According to docs, [sequence is not supported](https://vitess.io/docs/20.0/user-guides/vschema-guide/sequences/). At least not supported in the usual way. Lets disable the sequence feature and see if the installation can progress. The function responsible for creating sequence is *create_sequence* found at *apps/frappe/frappe/database/sequence.py*.

![disable create sequence feature](/images/disable-create-sequence.png)

Another error occured.
```
pymysql.err.InternalError: Packet sequence number wrong - got 3 expected 1
```
The error is related to packet handling by pymysql. Vitess use vtgate as entry point for connection. Maybe there is slight difference in how vtgate handle connection(or session) compared to mariadb. Maybe restarting vitess will resolve the issue.

```bash
cd ~/my-vitess-example/examples/local
./401_teardown.sh && ./101_initial_cluster.sh
```

Indeed restarting vitess (temporarily) fix the issue. Just got another default value error. Let me fix it and see if there will be another error.

![frappe asking administrator password](/images/frappe-asking-administrator-password.png)

Finally! After fixing couple of defaut value error, frappe finally ask for Administrator password. Lets try to create apps and add it to new site.

```bash
bench new-app library_management
bench --site library.test install-app library_management
```

![add app to frappe site](/images/add-app-to-frappe-site.png)


No error! Register the domain into the host */etc/hosts* and see if the setup page is accessible.

Retrieve the ip address of the container:
```bash
lxc list
```

Edit the /etc/hosts file:
```bash
sudo vim /etc/hosts
```

Register the library.test record:
```hosts
10.170.117.218	library.test
```

Lets open the setup page at [http://library.test:8000](http://library.test:8000)

![frappe setup page](/images/frappe-setup-page.png)

ITS WORKING!

![frappe setup page 1](/images/frappe-setup-page-1.png)
![frappe setup page 2](/images/frappe-setup-page-2.png)
![frappe setup process](/images/frappe-setup-process.png)
![frappe setup complete](/images/frappe-setup-complete.png)
![frappe desk](/images/frappe-desk.png)

The desk is also accessible!.

## Recap
Now lets recap all the "hack" needed to get into desk.
1. Pymysql connection refused. This is caused by difference port being use. Fixed using *--db-port* flag. No hack is necessary.
2. Vitess [don’t support CREATE USER](https://vitess.io/docs/21.0/user-guides/configuration-advanced/user-management/). `bench new-site` by default will try to create user and database. Fortunately, there is *--no-setup-db* and other *--db-\** related flag to fix this issue.
3. Redis connection refused. If I remember correctly, *new-site* not need redis when using mariadb. But here bench complain about it. Though, running `bench start` (effectively running redis too) allow the setup to progress.
4. Vitess don’t support default value on TEXT column. A lot of vitess default doctype use default value on TEXT column. Removing the default value from doctype definition temporarily fix the issue. I think it can cause another issue if not fixed correctly. Here is list of doctype need patching.
     * apps/frappe/frappe/desk/doctype/workspace/workspace.json
     * apps/frappe/frappe/email/doctype/notification/notification.json
     * apps/frappe/frappe/core/doctype/user/user.json
     * apps/frappe/frappe/integrations/doctype/oauth_client/oauth_client.json
     * apps/frappe/frappe/automation/doctype/auto_repeat/auto_repeat.json
     * apps/frappe/frappe/automation/doctype/assignment_rule/assignment_rule.json
5. Error release savepoint. Vitess supposedly [support savepoint](https://github.com/vitessio/vitess/issues/4462). But, for some [unknown reason](https://github.com/vitessio/vitess/issues/6754) it won't work. Disable the savepoint function/feature allow the setup to progress.
6. Vitess [don't support CREATE SEQUENCE](https://vitess.io/docs/20.0/user-guides/vschema-guide/sequences/). There is [workaround](https://vitess.io/docs/20.0/user-guides/vschema-guide/sequences/) for this missing support. Hack the sequence function/feature allow the setup to progress.
7. Error packet sequence number wrong. No clue about this error. I believe this is related to connection/session handling. Restarting vitess allow the setup to progress.

I think thats it. Error and patch needed can be found on my github repository [https://github.com/rochimfn/error-bringup-frappe-vitess](https://github.com/rochimfn/error-bringup-frappe-vitess). Thank you and see you next time.