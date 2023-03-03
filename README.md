# ciphercat

Ciphercat is based on [Local-PGP from x0th](https://github.com/x0th/Local-PGP) and has the target to easily enable cryptography independent to the underlying website (or medium in future).
Like in the origin Local-PGP, [OpenPGP.js](https://github.com/openpgpjs/openpgpjs) library has been used as for the cryptographic aspects of this app.

Thanks to all developers and please let me know if I made something wrong or you are unhappy with that development!

## Features (in development)

* Generate OpenPGP keys or add already existing ones and manage them easily.
* Use a Masterkey (which is kept temporally in memory only) to get more secure access to your stored keys.
* Use automatic encryption and decryption feature for:
	- wordpress: Yes you can even create a public but secret diary!
	- twitter **(in active development)**: You want to restrict access to your tweets to a small usergroup? Encrypt your messages by using your Private Key and share the corresponding Public Key to your usergroup!
	- **more coming**

* **(in active development)** Use Copy&Paste feature to decide which parts should be encrypted or decrypted by yourself.

**Please note: This addon is not yet meant to get out of alpha stage. By usage, there is always a very high chance to loose all keys and with that every encrypted data. Feel free to use the addon as a funny gimmick, but please don't hardly rely on its security and functionality!**

## Plafforms

Currently this add-on only exist for Firefox but it should be easy to port it to Chrome and this could happen in near future. Plans to integrate the service in some Android app also exist.