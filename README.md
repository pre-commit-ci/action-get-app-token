[![pre-commit.ci status](https://results.pre-commit.ci/badge/github/pre-commit-ci/action-get-app-token/main.svg)](https://results.pre-commit.ci/latest/github/pre-commit-ci/action-get-app-token/main)

action-get-app-token
====================

a github action to retrieve an application token

### example usage

```yaml
    - uses: pre-commit-ci/action-get-app-token@v1.0.0
      id: app-token
      with:
        app: ${{ secrets.APP_ID }}
        pkey64: ${{ secrets.APP_PKEY64 }}
    - uses: actions/checkout@v3
      with:
        repository: your-org/some-private-repo
        token: ${{ steps.app-token.outputs.token }}
        path: some-private-repo
```

- `APP_ID`: your app id
- `APP_PKEY64`: base64 encoded app secret pem
