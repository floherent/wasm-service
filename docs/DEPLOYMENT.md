# Deploying on a Remote Server

This document offers brief guidance on how to deploy and run `wasm-service` on a
remote server using Amazon Elastic Compute (EC2) instance or on a virtual machine
(VM) in Microsoft Azure.

> **Disclaimer**: This documentation contains some technical terms/notions and
> does not try to provide detailed information on them. If further explanation is
> needed, feel free to explore the [EC2's official documentation][ec2-docs] or
> the [Azure VM's documentation][azurevm-docs].

## Introduction

This tutorial is intended to teach the basics of deploying a wasm on your own
infrastructure. It is not intended to articulate a full production-quality
implementation. A full implementation will involve other considerations like IAM,
scaling, logging, etc. For more information on how to deploy a production-ready
API service, please contact our [Customer Success][coherent-helpdesk] for assistance.

Having a sandbox will help run all sorts of tests within an isolated yet controlled
environment across your team. Some key benefits include:

- Testing environment (good for experimenting and collaborating)
- Resource control (adjust the computational resources as needed)
- Security and compliance (use of separate credentials and access control to avoid risks)
- Learning and training
- and more.

## Prerequisites

With the appropriate access rights, you will need the following:

- a running EC2 instance or Azure VM
- access to a shell (bash, zsh, PowerShell, git-bash, etc.) that supports [SSH client][ssh-client].
- user credentials (ideally, an identity file)
- connection details (login name and IP address or domain name).

Your AWS/Azure Admin should provide you with the credentials and connection details.
And keep in mind that the Admin can invalidate them at some point if necessary.
If this is not the case for you and you need to start from scratch, please follow
their respective user guides to create an [EC2 instance][setup-ec2-docs] or a
[Linux virtual machine][setup-vm-docs] in Azure.

> **IMPORTANT**: By default, the service will be running on port `8080`, which might
> not be accessible to the outside world. You'll need to update the security group
> rules for your EC2 instance or Azure VM to allow incoming traffic on port `8080`.

## Connect via SSH

Assuming the shell is up and running, the following command will help connect to
the sandbox via SSH:

```bash
# sample command of how to connect to the sandbox
$ ssh -i [path/to/identity-file] [login-name]@ip-address
```

> **NOTE**: By default, the EC2 login name or username is `ec2-user`, and for Azure
> VMs, it's `azureuser`. We'll use `ec2-8-8-8-8.compute-1.amazonaws.com` as the
> EC2 instance's domain name and `10.10.10.10` as the IP address for Azure VM in
> the following examples. Please replace them with your own credentials.

An example of that connection request on a Unix-based machine may look as follows:

```bash
# example of how to connect to the EC2 sandbox
$ ssh -i ~/.ssh/keys/ec2_key.pem ec2-user@ec2-8-8-8-8.compute-1.amazonaws.com

# example of how to connect to the Azure VM sandbox
$ ssh -i ~/.ssh/keys/azure_key.pem azureuser@10.10.10.10.10
```

Alternatively, a user may choose to use a [SSH Client config file][ssh-config-file]
to connect to the sandbox.

Usually located at `~/.ssh/config`, if the `config` file (no extension) doesn't
exist, create one.

```bash
# use any text editor of your choice (vim, nano, etc.)
$ vim ~/.ssh/config
```

Then add the following content:

```bash
# for Amazon EC2
Host aws-sandbox
  HostName ec2-8-8-8-8.compute-1.amazonaws.com
  User ec2-user
  IdentityFile ~/.ssh/keys/ec2_key.pem

# for Azure VM
Host azr-sandbox
  HostName 10.10.10.10
  User azureuser
  IdentityFile ~/.ssh/keys/azure_key.pem
```

With this configuration, a connection request via SSH is as easy as running this
command:

```bash
# connect to Amazon EC2 sandbox
$ ssh aws-sandbox

# connect to Azure VM sandbox
$ ssh azr-sandbox
```

### Troubleshooting

#### Permission Denied

When using SSH IdentityFile to establish an SSH connection, the SSH agent needs
the right permission to perform properly. If not, you may run into "permission
denied" issues:

```text
login_name@ec2-8-8-8-8.compute-1.amazonaws.com: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

Change the file mode to: `400`.

```bash
# for EC2 key
$ chmod 400 ~/.ssh/keys/ec2_key.pem

# for Azure key
$ chmod 400 ~/.ssh/keys/azure_key.pem
```

#### Wrong `login_name`

If the `login_name` is not set properly or missing, you may run into a warning /
error denying access to the sandbox. For example, if the `login_name` does not
exist in `~/.ssh/config` as `User`, SSH will assume your current username from
your environment variable.

```bash
$ echo $USERNAME
> john.doe # unlikely to be the same as the sandbox's login name
```

## Deploy the API Service

Once you can securely connect to the sandbox, you can copy the `wasm-service`
folder to the sandbox. Then you can build and run the service.

### Transfer the Repo to the Sandbox

Start by copying the `wasm-service` folder to the sandbox via secure shell.
The `scp` command, which stands for "secure copy," allows you to securely transfer
files and directories between your local machine and the remote server.

```bash
# copy the service folder to the EC2 sandbox
$ scp -i ~/.ssh/keys/ec2_key.pem -r /path/to/local/folder ec2-user@ec2-8-8-8-8.compute-1.amazonaws.com:/path/to/remote/folder

# For Azure VM sandbox
$ scp -i ~/.ssh/keys/azure_key.pem -r /path/to/local/folder azureuser@10.10.10.10:/path/to/remote/folder
```

You can also zip the folder and transfer it to the sandbox. Then unzip it.

```bash
# 1. zip the service folder
$ zip -r wasm-service.zip wasm-service

# 2. copy the zip file to the sandbox (e.g., EC2)
$ scp -i ~/.ssh/keys/ec2_key.pem wasm-service.zip ec2-user@ec2-8-8-8-8.compute-1.amazonaws.com:/path/to/remote/folder

# 3. connect to the sandbox
$ ssh aws-sandbox

# 4. unzip the file on the sandbox
$ cd /path/to/remote/folder
$ unzip wasm-service.zip
```

> An alternate way is to dockerize the service and push the image to a private
> registry. Then pull the image from the registry to the sandbox and run it.

### Build and Run the Service

In the [Developer Guide](DEVELOPER.md), we've covered how to build and run the
service. The same steps apply within an EC2 instance or an Azure virtual machine.

```bash
# 1. connect to the sandbox
$ ssh aws-sandbox # or ssh azr-sandbox
$ sudo su

# 2. navigate to the service folder
$ cd /path/to/remote/folder/wasm-service

# 3a. build and run the service
$ npm install && npm run start

# 3b. or use docker to build and run the service
$ docker build -t wasm-service .
$ docker run --name wasm-service -p 8080:8080 -d wasm-service
```

> [!IMPORTANT]
> If you're using docker to build and run the service, you'll need to use a named
> volume to persist the data. Otherwise, the data will be lost when the container
> is removed. To do so, you'll need to update the `Dockerfile` and the `docker run`.

Assuming that your upload path is `uploads`, edit the [Dockerfile](../Dockerfile)
by adding the `VOLUME /app/uploads` layer before `CMD ["node", "dist/main"]`. So,
the previous Docker command will look like this:

```bash
# 3b. or use docker to build and run the service
$ docker build -t wasm-service .
$ docker run --name wasm-service -p 8080:8080 -v ws-data:/app/uploads -d wasm-service
```

The `ws-data` volume will be used to persist the data. If you need to remove the
volume, run `docker volume rm ws-data`, and revert the `Dockerfile` to its original.

## Test the API Service

Once the service is up and running, you can test it by sending a request to the
sandbox. The following example uses `curl` to send the request.

```bash
# Use the sandbox's IP address or domain name
$ curl http://ec2-8-8-8-8.compute-1.amazonaws.com:8080/health # or http://10.10.10.10:8080/health
> {"status":"ok","info":{"wasm_data":{"status":"up","sizeInMB":0},"disk_storage":{"status":"up"},"memory_heap":{"status":"up"},"memory_rss":{"status":"up"}},"error":{},"details":{"wasm_data":{"status":"up","sizeInMB":0},"disk_storage":{"status":"up"},"memory_heap":{"status":"up"},"memory_rss":{"status":"up"}}}
```

Happy deploying 🎉!

<!-- References -->

[ec2-docs]: https://docs.aws.amazon.com/ec2/index.html
[azurevm-docs]: https://learn.microsoft.com/en-us/azure/virtual-machines/
[setup-ec2-docs]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/get-set-up-for-amazon-ec2.html
[setup-vm-docs]: https://learn.microsoft.com/en-us/azure/virtual-machines/linux/quick-create-portal?tabs=ubuntu
[coherent-helpdesk]: https://coherentglobal.atlassian.net/servicedesk/customer/portals
[ssh-client]: https://www.ssh.com/academy/ssh/client
[ssh-config-file]: https://goteleport.com/blog/ssh-client-config-file-example/
