---
layout: post
title: "Setup Golang Remote Debug"
date: 2025-02-14 20:59:58 +0700
categories: [golang,kubernetes,microk8s]
---

This is the golang version of my last post about [Setup Java Remote Debug](/setup-java-remote-debug/). Turns out golang also support remote debugging!

## Setup Kubernetes
I will use the same kubernetes as [last post](/setup-java-remote-debug/). I re-use a lot of helm configuration. So, to avoid conflict, I have to teardown my last deployment.

```bash
cd demo-remote-debug-java
./scripts/helm-uninstall.sh
```

## Setup Remote Debug
Just like the [last post](/setup-java-remote-debug/), I have prepared the web service. The demo repository can be found at [https://github.com/rochimfn/demo-remote-debug-golang](https://github.com/rochimfn/demo-remote-debug-golang). 

Get the demo web service:
```bash
git clone https://github.com/rochimfn/demo-remote-debug-golang.git
```

I also use the same set of deployment script. Execute one by one below script to deploy into microk8s:
```bash
cd demo-remote-debug-golang
chmod +x scripts/*.sh       # give execute bit into to script
./scripts/docker-build.sh   # build docker image
./scripts/push-image.sh     # push container image into microk8s registry
./scripts/helm-install.sh   # deploy into microk8s kubernetes using helm
```

![deploy into kubernetes](/images/deploy-remote-debug-golang.png)

Check the deployment status using kubernetes dashboard. Run the dashboard proxy:
```bash
microk8s dashboard-proxy
```

Copy the token from terminal and access the dashboard at [https://127.0.0.1:10443](https://127.0.0.1:10443). The deployment should be green.

![deployment status](/images/demo-remote-debug-golang-deployment-on-kubernetes.png)

Go to [http://microk8s.local](http://microk8s.local) to access the web service. The web service only contains two endpoint "/" and "/hello" just like the java demo version.

The remote debug function is configured by following [this delve documentation](https://github.com/go-delve/delve/blob/master/Documentation/api/ClientHowto.md). No extra code needed in the program itself. The changes only needed in the build and run process. 

In the build process, defined by *Dockerfile* file, there are two changes needed. The first is to include the delve command line. The second, is to add extra flag *-gcflags='all=-N -l'* on the `go build` command. Passing the flag into go build will disable some optimizations on the generated binary, so the program can be properly debug by delve. Learn more about the flags by executing `go help build` and/or `go tool compile`.

```dockerfile
FROM golang:1.23 AS builder
WORKDIR /opt/demo
COPY . .
RUN go install github.com/go-delve/delve/cmd/dlv@v1.24.0
RUN go build -gcflags='all=-N -l' .

FROM ubuntu:noble AS runner
WORKDIR /opt/demo
COPY --from=builder /opt/demo/demo-remote-debug-golang .
COPY --from=builder /go/bin/dlv .
COPY scripts/entry-point.sh .
CMD ["./entry-point.sh"]
```

In the run process, defined by *.entry-point.sh* script, instead of executing the program binary directly, the binary must be executed with `dlv` (delve command line tools) with flags to enable remote debugging. I also added switch to enable or disable remote debugging using environment variable DEBUG_MODE, just like the java version. Learn more about the `dlv` flags by reading [this doc](https://github.com/go-delve/delve/blob/master/Documentation/usage/dlv_exec.md) with browser or in the terminal by executing `dlv exec --help`.

```bash
#!/bin/sh


if [ "$DEBUG_MODE" = "1" ]; then
    echo "DEBUG_MODE is active"
    ./dlv exec /opt/demo/demo-remote-debug-golang --headless --listen=:8888 --accept-multiclient --continue
else
    echo "DEBUG_MODE is inactive"
    ./demo-remote-debug-golang
fi
```

The remote debugging is disabled by default (DEBUG_MODE != "1"). Go to Config Maps menu in kubernetes dashboard. There should be configs named *demo-golang-remote-debug-helm*.  Edit it by clicking the config and then click on the pencil icon. Change the DEBUG_MODE value from 0 to 1. Update.

![set config maps to enable remote debug](/images/enable-remote-debug-mode-golang-kubernetes.png)

Go to Deployments and restart *demo-golang-remote-debug-helm* deployment to apply the config maps.

![restart deployment](/images/restart-deployment-remote-debug-golang.png)

Now, verify the dlv is running by go to Pods menu then Exec on *demo-golang-remote-debug-helm-\** pod to access the console.

![exec on pod](/images/exec-on-pod-demo-golang-remote-debug-helm.png)

Run command `ps -aux` to list running process in the container. If everything is correct, there is should be `dlv` running process.

![dlv is running](/images/dlv-is-running.png)

## Remote Debug with IDE

The remote debug server is listening at port 8888. But, just like the java version, this port is not exposed. So, port forward is neccessary.

Forward port:
```bash
microk8s kubectl port-forward deployments/demo-golang-remote-debug-helm 8888:8888
```
> Forwarding using pods maybe better if the number of pod inside deployment is not 1.

Test connection with dlv:
```bash
go install github.com/go-delve/delve/cmd/dlv@v1.24.0
dlv connect localhost:8888
```

![dlv connect to dlv remote server](/images/dlv-connect-to-remote-server.png)


### Visual Studio Code
Visual Studio Code is available in Ubuntu [App Center/Snap Store](https://snapcraft.io/code). Though, I personally like to install Visual Studio Code directly from microsoft repository as [deb package](https://code.visualstudio.com/docs/setup/linux#_debian-and-ubuntu-based-distributions).

Install Visual Studio Code:
```bash
sudo apt install wget gpg apt-transport-https
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" |sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
rm -f packages.microsoft.gpg
sudo apt update && sudo apt install code
```

Install [Go Extension by Go Team at Google](https://marketplace.visualstudio.com/items?itemName=golang.go).

![go visual studio code extension](/images/go-vscode-extensions.png)

Open the web service project in Visual Studio Code:
```bash
cd demo-remote-debug-golang/
code .
```

I have prepare Visual Studio Code launch configuration for attaching VS Code into remote debug server. The configuration is saved at *.vscode/launch.json*. Learn more at [VS Code golang debugging documentation](https://github.com/golang/vscode-go/blob/master/docs/debugging.md).

```json
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach and debug",
            "type": "go",
            "request": "attach",
            "port": 8888,
            "host": "127.0.0.1", // can skip for localhost
            "mode": "remote",
          }
    ]
}
```

To execute the launch configuration, open menu Run and Debug in the sidebar. In the top of sidebar, there will be play button with option called "Attach and debug" (if not, change it to "Attach and debug"). Click on the play button to start debug session.

![run and debug menu in visual studio code](/images/run-and-debug-menu.png)

There will be debug control showed up at the top of the VS Code. And the color theme will slightly changing. The debug session now is started.

![remote debug session golang](/images/golang-remote-debug-session-started.png)

Breakpoint can be set by clicking on the line number of the source code.

![set breakpoint vscode golang](/images/set-breakpoint-vscode-golang.png)

Trigger the breakpoint by opening the endpoint in browser. For example if the breakpoint is on */hello* handler, go to [http://microk8s.local/hello?name=test](http://microk8s.local/hello?name=test).

![vscode golang remote debug](/images/vscode-golang-remote-debug.png)

I think that's it from me. Thank you and see you later.