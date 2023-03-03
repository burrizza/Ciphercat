# Ciphercat

The Firefox Add-on Ciphercat is based on [Local-PGP](https://github.com/x0th/Local-PGP) from [x0th](https://github.com/x0th) and has been developed to enable easy cryptography for everyone and everywhere.
Like in Local-PGP, the [OpenPGP.js](https://github.com/openpgpjs/openpgpjs) library has been used for all the cryptographic  stuff.


**Please note: This addon is not yet meant to get out of alpha stage. By usage, there is always a very high chance to loose all your keys and with that, also all your encrypted data. Feel free to use the addon as a funny gimmick, but please don't hardly rely on its security and functionality!**

Thanks to all developers and please let me know if I made something wrong or you are unhappy with this development!

## Features (in development)

* Generate, add and manage locally stored OpenPGP keys.
* Use a Masterkey (which is kept in memory only) to encrypt and decrypt all locally stored data.
* Use your clipboard for easy and quick cryptography.
* Use an automatic encryption and decryption feature for:
	- wordpress (ever wanted make a blog that no one can read, **this is your chance!**)
	- twitter **(in active development)** (This enables a private user group feature. **Eat this, bird!**)
	- **more coming**


## Platforms

Currently this add-on exists for Firefox only.


## Usage

1. Installation
You can install the add-on manually, or hopefully through [addons.mozilla.org](https://addons.mozilla.org/addon/ciphercat/).
2. Navigate to **Settings** and setup your Masterkey
After Installation you should be asked to setup a masterkey. Keep this key secure, because all of your internal stored data will **not be accessible without it anymore**. After the successful verification with your Masterkey, the key will be kept in memory for the current session. Please consider to close your Firefox before leaving your device alone.
3. Navigate to **Settings** > **Add Key**
Now it is time to add some key bundles! A key bundle consists out of the following fields:
   Name          -->  Name of the key bundle
   Description   -->  You can add some short description about the usage of the key bundle.|
   Passphrase    -->  Must be a secure password. It is used to encrypt your Private Key internally. Without it, your Private Key could not be used anymore for decryption. |
   Private Key   -->  This key should kept (surprise) PRIVATE. It could be used to **decrypt** data, that has been encrypted by using the **corresponding Public Key** before. |
   Public Key    -->  This key could kept (guess what) PUBLIC. It could only be used to **encrypt** data. |

Use **Generate Keys** to generate fresh randomly keys. You can also add already existing keys by 
  * using the context menu **Import Keys using a JSON-File**(right-click) or 
  * using **Paste JSON** to add i.e. previously stored keys.
3. Navigate to **Settings** > **List Keys**
Now you can see your previously added key. You should export and store it to a save place. But please be aware: **Exported data is not encrypted anymore, which means that your Passphrase is readable by everyone!**
4. Navigate to **Encrypt**
Select a key you want to take for encryption. This key is stored temporally and used for context-menu actions after clicking **Select Key for Encryption**. It is possible to use someones Public Key for example, to send him an encrypted message.
5. Navigate to **Decrypt**
Select a key you want to take for decryption. This key is stored temporally and used for context-menu actions after clicking **Select Key for Decryption**.
6. Context-Menu > **Ciphercat** > **Encrypt to Clipboard**
Select some text first and activate then the context menu with right-click.
7. Navigate to **Encrypt** > **Select Key for Encryption** > **Select Target for Encryption**
This activates the automatic encryption feature for wordpress sites.
8. Navigate to **Decrypt** > **Select Key for Decryption** > **Select Target for Decryption**
This activates the automatic decryption feature for wordpress sites.