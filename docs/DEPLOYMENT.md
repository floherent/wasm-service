# Deploying on Amazon EC2

This document offers brief guidance on how to run `wasm-service` on a AWS (Amazon
Web Services) sandbox using Amazon Elastic Compute (EC2) instance.

> **Disclaimer**: This documentation contains some technical terms/notions and
> does not try to provide detailed information on them. If further explanation is
> needed, feel free to explore the [EC2's official documentation][ec2-docs].

## Introduction

This tutorial is intended to teach the basics of deploying a wasm on your own
infrastructure. It is not intended to articulate a full production-quality
implementation. A full implementation will involve other considerations like IAM,
scaling, logging, etc. For more information on how to deploy a production-ready
API service, please contact our [Customer Success][coherent-helpdesk] for assistance.

Having a sandbox will help run all sorts of tests within an isolated yet controlled
environment across your team. Some key benefits include:

* Testing environment (good for experimenting and collaborating)
* Resource control (adjust the computational resources as needed)
* Security and compliance (use of separate credentials and access control to avoid risks)
* Learning and training
* and more.

## Prerequisites

With the appropriate access rights, you will need the following:

* a running EC2 instance
* access to a shell (bash, zsh, PowerShell, git-bash, etc.) that supports [SSH client][ssh-client].
* user credentials (ideally, an identity file)
* connection details (login name and IP address or domain name).

Your AWS Admin should provide you with the credentials and connection details.
And, keep in mind that the Admin can invalidate them at some point if necessary.
If this is not the case for you and you need to start from scratch, please follow
this [user guide][setup-ec2-docs] to create an EC2 instance.

> **IMPORTANT**: By default, the service will be running on port `8080`, which might
> not be accessible to the outside world. You'll need to update the security group
> rules for your EC2 instance to allow incoming traffic on port `8080`.

## Connect via SSH

Assuming the shell is up and running, the following command will help connect to
the sandbox via SSH:

```bash
ssh -i [path/to/identity-file] [login-name]@ip-address
```

> **NOTE**: By default, the EC2 login name or username is `ec2-user`.

An example of that connection request on a Unix-based machine may look as follows:

```bash
ssh -i ~/.ssh/keys/my_key.pem ec2-user@ec2-8-8-8-8.compute-1.amazonaws.com
```

Alternatively, a user may choose to use a [SSH Client config file][ssh-config-file]
to connect to the sandbox.

Usually located at `~/.ssh/config`, if the `config` file (no extension) doesn't
exist, create one.

```bash
touch ~/.ssh/config # or vim ~/.ssh/config
```

Then add the following content:

```bash
Host aws-sandbox
  HostName ec2-8-8-8-8.compute-1.amazonaws.com # or the IP address
  User ec2-user
  IdentityFile ~/.ssh/keys/my_key.pem
```

With this configuration, a connection request via SSH is as easy as running this
command:

```bash
ssh aws-sandbox
```

### Troubleshooting

#### Permission Denied

When using SSH IdentityFile to establish an SSH connection, the SSH agent needs
the right permission to perform properly. If not, you may run into "permission
denied" issues:

```text
login_name@ec2-8-8-8-8.compute-1.amazonaws.com: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

Change the file mode to: `700`.

```bash
chmod 700 '~/.ssh/keys/my_key.pem'
```

#### Wrong `login_name`

If the `login_name` is not set properly or missing, you may run into a warning /
error denying access to the sandbox. For example, if the `login_name` does not
exist in `~/.ssh/config` as `User`, SSH will assume your current username from
your environment variable.

```bash
echo $USERNAME # will output your username.
```

## Deploy the API Service

Once you can securely connect to the sandbox, you can copy the `wasm-service`
folder to the sandbox. Then you can build and run the service.

### Transfer the Repo to EC2

Start by copying the `wasm-service` folder to the EC2 instance via secure shell.
The `scp` command, which stands for "secure copy," allows you to securely transfer
files and directories between your local machine and the remote EC2 instance.

```bash
scp -i ~/.ssh/keys/my_key.pem -r /path/to/local/folder ec2-user@ec2-8-8-8-8.compute-1.amazonaws.com:/path/to/remote/folder
```

> An alternate way is to dockerize the service and push the image to a private
> registry. Then pull the image from the registry to the EC2 instance and run it.

### Build and Run the Service

In the [Developer Guide](DEVELOPER.md), we've covered how to build and run the
service. The same steps apply within an EC2 instance.

```bash
# 1. connect to the sandbox
ssh aws-sandbox
sudo su

# 2. navigate to the service folder
cd /path/to/remote/folder/wasm-service

# 3a. build and run the service
npm install && npm run start

# 3b. run the service via docker
docker build -t wasm-service .
docker run --name wasm-service -p 8080:8080 -d wasm-service
```

## Test the API Service

Once the service is up and running, you can test it by sending a request to the
sandbox. The following example uses `curl` to send a request to the sandbox.

```bash
# Use the sandbox's IP address or domain name
curl http://ec2-8-8-8-8.compute-1.amazonaws.com:8080/health
```

Happy deploying 🎉!

<!-- References -->
[ec2-docs]: https://docs.aws.amazon.com/ec2/index.html
[setup-ec2-docs]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/get-set-up-for-amazon-ec2.html
[coherent-helpdesk]: https://coherentglobal.atlassian.net/servicedesk/customer/portals
[ssh-client]: https://www.ssh.com/academy/ssh/client
[ssh-config-file]: https://goteleport.com/blog/ssh-client-config-file-example/
