# Syneva

An integrated review environment (IRE) for code you didn't write by hand.

Fresh start. The previous implementation is archived at
[NextNodeSolutions/syneva-archive](https://github.com/NextNodeSolutions/syneva-archive).

The dashboard signs users in with Better Auth and reads selected GitHub App repositories and pull requests. See [GitHub setup](docs/github-setup.md) for App registration, vault configuration, local development, and CI deployment.

Reviewing code that is still on a developer's machine is the second stage of the restart. [Local connections](docs/local-connections.md) holds its design. A CLI on that machine connects out to the dashboard, and nothing listens on it.
