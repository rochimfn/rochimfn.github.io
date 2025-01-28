---
layout: post
title: "Setup Java Remote Debug"
date: 2025-01-27 16:31:07 +0700
categories: [java,kubernetes,microk8s]
---

Java Remote Debug is JVM feature that allow developer to debug application over the network. I found this feature while working on my last workplace. This feature is very handy, especially in testing phase. When bug is found by the tester, developer can just connect to debugger over the network. This can shorten the "reproduce bug" phase and allow interactive debugging session between developer and tester. Though, the feature is already up and running while I was there. Thats why in this post I will try to set this up by myself.


## Setup Kubernetes
I will use kubernetes to deploy the application. Since I am on Ubuntu, microk8s is reasonable choice. Microk8s is kubernetes distribution by Canonical, maker of Ubuntu. Microk8s is distributed using snapd. Snapd is already installed on Ubuntu since version 16.04. Go to [https://microk8s.io/](https://microk8s.io/) to learn more about Microk8s.

Install microk8s:
```bash
sudo snap install microk8s --classic
```

Setup microk8s permission:
```bash
sudo usermod -a -G microk8s $USER
mkdir -p ~/.kube
sudo chown -R $USER ~/.kube
```

Restart!

Check installation:
```bash
microk8s status --wait-ready
```
The microk8s should be running.
![microk8s is running](/images/microk8s-running.png)

Microk8s have feature called addons. Addons is prepackage component or container that can be installed easily using microk8s command line. I think I will need helm, dashboard, registry, and ingress. 
* Helm is package manager for kubernetes. Helm can simplify the deployment process and manifest generation. Read more at [https://helm.sh/](https://helm.sh/). Helm is preinstalled on microk8s.
* Dashboard is addon to install kubernetes dashboard, web ui for kubernetes. Read more at [https://github.com/kubernetes/dashboard](https://github.com/kubernetes/dashboard).
* Registry is addon to install local image registry for hosting docker image.
* Ingress is one of multiple way to expose your application. Ingress addon will install simple nginx based ingress.

Install addon using `microk8s enable`:
```bash
microk8s enable dashboard
microk8s enable registry
microk8s enable ingress
```

Accessing dashboard:
```bash
microk8s dashboard-proxy
```

Copy the printed token and go to the link printed in terminal. Paste the token in the provided field and sign in.
> There will be certificate warning at first time accessing the dashboard. It is expected because microk8s dashboard using self signed certificate.

![kubernetes dashboard login page](/images/kubernetes-dashboard-login-page.png)


Change namespace to *container-registry* to check the registry deployment.
![local registry deployment](/images/microk8s-container-registry-deployment.png)

Change namespace to *ingress* to check the ingress deployment.
![ingress deployment](/images/microk8s-ingress-deployment.png)


## Setup Remote Debug
I have prepared the web service. You can find it at [https://github.com/rochimfn/demo-remote-debug-java](https://github.com/rochimfn/demo-remote-debug-java). It is written in spring boot framework. Nothing special about it. It straightly taken from spring boot quickstart guide. It only contains two endpoint "/" and "/hello". Both will return simple text.

Get the web services:
```bash
git clone https://github.com/rochimfn/demo-remote-debug-java.git
```

I have added Dockerfile to build the service into docker image. And I also added helm chart configuration to easy deploy the docker image into kubernetes. The Dockerfile use *scripts/entry-point.sh* as entry point for the docker image. I think this is the most important part for setup remote debug. Here is the content of *scripts/entry-point.sh*:

```bash
#!/bin/sh

if [ "$DEBUG_MODE" = "1" ]; then
    echo "DEBUG_MODE is active"
    java -Xdebug -Xrunjdwp:transport=dt_socket,address=8888,server=y,suspend=n -jar demo-0.0.1-SNAPSHOT.jar
else
    echo "DEBUG_MODE is inactive"
    java -jar demo-0.0.1-SNAPSHOT.jar
fi
```

First, I check the DEBUG_MODE environment variable. If the DEBUG_MODE is unset or have value other than "1", I will run the service (already packaged as jar) without any flag.
```bash
java -jar demo-0.0.1-SNAPSHOT.jar
```
But, when the DEBUG_MODE is set with value "1", I will run the service with debugging flag enable.
```bash
-Xdebug -Xrunjdwp:transport=dt_socket,address=8888,server=y,suspend=n
```
The flag is taken from [old oracle documentation](https://docs.oracle.com/javase/8/docs/technotes/guides/troubleshoot/introclientissues005.html) with little adjustment. Basically, the flag is instruct the jvm to enable debugging over network at port 8888. `suspend=n` instruct the jvm to run the application as is without waiting for debugger to attach to the jvm.
> While reading another references, I found that the debug flag is already deprecated. The flag is still working on jre 17. But adjustment may needed if run with another version.

Lets deploy the services into kubernetes. Allow execute on helper script:
```bash
cd demo-remote-debug-java
chmod +x scripts/*.sh
```

Build the docker image:
```bash
./scripts/docker-build.sh
```

Push the image into microk8s private registry:
```bash
./scripts/push-image.sh
```

Deploy the services to microk8s:
```bash
./scripts/helm-install.sh
```
![helm install success](/images/helm-install-success.png)

Go to the kubernetes dashboard to check the status of deployment.
![kubernetes dashboard deployment success](/images/kubernetes-dashboard-success-deploy.png)

Register the hostname entry into the */etc/hosts* to be able to access the services through ingress. Edit the */etc/hosts*:
```bash
sudo vim /etc/hosts
```
Register the hostname:
```
127.0.0.1 	microk8s.local
```

Go to [http://microk8s.local](http://microk8s.local) and the service should be up.

![spring boot service up and running](/images/spring-boot-up-and-running.png)
![spring boot service up and running 2](/images/spring-boot-up-and-running-2.png)

By default the remote debugging is disabled (DEBUG_MODE != "1"). To enable it, go to Config Maps menu and choose *demo-java-remote-debug-charts*.
![configmap of remote debug service (before)](/images/configmap-java-remote-debug-service.png)

Edit the configmap by clicking edit button (pencil). And change the value of DEBUG_MODE to 1.
![configmap of remote debug service (after)](/images/configmap-java-remote-debug-service-after.png)

Go to Deployment menu and restart the *demo-java-remote-debug-charts* deployment.
![restart deployment java remote debug service](/images/restart-deployment-java-remote-debug-service.png)

Go to Pods menu and Exec on *demo-java-remote-debug-charts-\** pod.
![exec on java remote debug pod](/images/exec-on-java-remote-debug-pod.png)

Run `ps -aux` in the terminal and verify the flag used to run the service. It should be using the debug flag.
![check jvm flag for java remote debug service](/images/check-jvm-flag-java-remote-debug-service.png)


## Remote Debug with IDE
How to remotely connect the jvm with local IDE? The jvm expose the remote debug at port 8888. I purposely do not expose port 8888 to outside container. Exposing debug feature openly is not good idea, especially in shared environment. Luckily, kubernetes have port-forward feature that can be used in this situation. Port-forward allow forwarding some port in pod(or etc) into local machine with kubectl and the permission (token). 

Create port-forwarding of deployment:
```bash
microk8s kubectl port-forward deployments/demo-java-remote-debug-charts 8888:8888
```
> Forwarding using pods maybe better if the number of pod inside deployment is not 1.

![kubectl port-forward](/images/kubectl-port-forward.png)

Open new terminal and test connect with jdb:
```bash
sudo apt install -y openjdk-17-jdk-headless # install first
jdb -attach 8888
```
![kubectl port-forward](/images/jdb-attach.png)

Hit `ctrl+d` to exit jdb.

### Eclipse IDE
In Ubuntu, Eclipse can be installed through snap.
```bash
sudo snap install eclipse --classic
```

Open Eclipse IDE and import *demo-remote-debug-java* as Maven project. Click on File > Import and follow the wizard.

![eclipse import project](/images/eclipse-import-project.png)
![eclipse import as existing maven project](/images/eclipse-import-project-maven.png)

Click on Run > Debug Configurations...

![eclipse debug configurations](/images/eclipse-debug-configuration.png)

Double click on Remote Java Application. Fill name with anything representable. On Project field, pick *demo* project. Change port to 8888. Click Debug. 
![eclipse new debug configurations](/images/eclipse-new-debug-configuration.png)

The IDE should be connnected to remote jvm.

![eclipse remote debug connected](/images/eclipse-remote-debug-connected.png)

Try to set breakpoint inside *hello* function.
![eclipse set breakpoint](/images/eclipse-breakpoint-in-hello-function.png)

Trigger the break point by accessing the endpoint. Go to [http://microk8s.local/hello?name=test](http://microk8s.local/hello?name=test). Eclipse will catch the breakpoint and offer to switch perspective.
![eclipse offer change perspective](/images/eclipse-offer-change-perspective-to-debug.png)

Choose Switch to change the Debug perspective.
![eclipse debug perspective](/images/eclipse-debug-perspective.png)

Done.

Thank you and see you later.