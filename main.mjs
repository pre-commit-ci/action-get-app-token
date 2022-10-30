import crypto from 'crypto';
import fs from 'fs';
import https from 'https';

function b64(s) {
  const safe = {'/': '_', '+': '-'};
  const ret = Buffer.from(s).toString('base64');
  return ret.replace(/[/+]/g, (c) => safe[c]).replace(/=+$/, '');
}

function jwt(pkey64, app) {
  const payload = {
    iat: Math.floor(+new Date() / 1000),
    exp: Math.floor(+new Date() / 1000) + 300,
    iss: app,
  };

  const key = crypto.createPrivateKey(Buffer.from(pkey64, 'base64'));
  const clear = [
    b64(JSON.stringify({typ: 'JWT', alg: 'RS256'})),
    b64(JSON.stringify(payload)),
  ].join('.');
  const opts = {key: key, padding: crypto.constants.RSA_PKCS1_PADDING}
  const signature = b64(crypto.sign('sha256', Buffer.from(clear), opts));
  return `${clear}.${signature}`;
}

async function req(meth, path, headers) {
  const opts = {
    hostname: 'api.github.com',
    port: 443,
    path: path,
    method: meth,
    headers: {'User-Agent': 'pre-commit-ci/action-get-app-token', ...headers},
  };
  const respData = await new Promise((resolve, reject) => {
    let data = [];

    const req = https.request(opts, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(`status: ${res.statusCode}`);
      }

      res.on('data', (part) => data.push(part));
      res.on('end', () => resolve(Buffer.concat(data)));
    });

    req.on('error', reject)
    req.end();
  });
  return respData;
}

async function createToken(app, pkey, owner) {
  const headers = {Authorization: `Bearer ${jwt(pkey, app)}`};

  let install;
  try {
    const resp = await req('GET', `/orgs/${owner}/installation`, headers);
    install = JSON.parse(resp).id;
  } catch {
    const resp = await req('GET', `/users/${owner}/installation`, headers);
    install = JSON.parse(resp).id;
  }

  const path = `/app/installations/${install}/access_tokens`;
  const resp = await req('POST', path, headers);
  const token = JSON.parse(resp).token;

  console.log('token acquired!');
  console.log(`::add-mask::${token}`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `token=${token}\n`);
  fs.appendFileSync(process.env.GITHUB_STATE, `token=${token}\n`);
}

async function delToken(token) {
  const headers = {Authorization: `token ${token}`};
  await req('DELETE', '/installation/token', headers);
  console.log('token deleted!');
}

async function main() {
  if (process.env.STATE_token) {
    console.log('butts');
    await delToken(process.env.STATE_token);
  } else {
    console.log('not butts');
    await createToken(
      process.env.INPUT_APP,
      process.env.INPUT_PKEY64,
      process.env.GITHUB_REPOSITORY_OWNER,
    );
  }
}

await main();
