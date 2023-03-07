/*
 * Modifications copyright 2023 burrizza
 * Copyright 2020 x0th (MIT license)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
'use strict';

var message;
let elFile;

let portFromPopup;
let sessionMasterKey;
let sessionEncryptionKey;
let sessionDecryptionKey;
let sessionEncryptTarget;
let sessionDecryptTarget;


/**
*  Async function returns promise with an asymmetrical encrypted string.
*
* @param 	{String} str 					- The string which should be encrypted.
* @param 	{Object} publicKeyArmored		- The public key which should be used for encryption.
* @param	{Object} privateKeyArmored 		- Optional private key for signing.
* @param	{String} pass					- Password for private key decryption.
* @return 	{Promise} 						- Promise with status.
***/
async function openpgpEncrypt(str, publicKeyArmored, privateKeyArmored, pass) {
	
	const publicKey = await openpgp.readKey({armoredKey: publicKeyArmored});
	const privateKey = null;
	// optional keep signing possible
	if (privateKeyArmored != null) {
		privateKey = await openpgp.decryptKey({
			privateKey: await openpgp.readPrivateKey({armoredKey: privateKeyArmored}), 
			passphrase: pass
			});
	}
	
	const message = await openpgp.createMessage({ text: str });
	const encrypted = await openpgp.encrypt({
		message, // input as Message object
		encryptionKeys: publicKey,
		signingKeys: privateKey, // optional
		format: 'armored', // ASCII armor (other options: binary, object)
		config: { 
			preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256, 
			preferredCompressionAlgorithm: openpgp.enums.compression.zlib
			}
			});
	return encrypted;
}

/**
*  Async function returns promise with an asymmetrical decrypted string.
*
* @param 	{String} encStr 				- The string which should be decrypted.
* @param	{Object} privateKeyArmored 		- The private key which should be used for decryption.
* @param 	{Object} publicKeyArmored		- Optional public key for signing.
* @param	{String} pass					- Password for private key decryption.
* @return 	{Promise} 						- Promise with status.
***/
async function openpgpDecrypt(encStr, privateKeyArmored, publicKeyArmored, pass) {
	
	let encPrivateKey = await openpgp.readPrivateKey({armoredKey: privateKeyArmored});
	let privateKey = await openpgp.decryptKey({privateKey: encPrivateKey, passphrase: pass});
	
	const publicKey = null;
	if (publicKeyArmored != null) {
		// optional keep verification possible
		const publicKey = await openpgp.readKey({armoredKey: publicKeyArmored});
	}

	
	const message = await openpgp.readMessage({ armoredMessage: encStr });
	const decrypted = await openpgp.decrypt({
        message, // input as Message object
        verificationKeys: publicKey, // optional
		decryptionKeys: privateKey, 
        format: 'armored', // ASCII armor (other options: binary, object)
		config: { 
			preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256, 
			preferredCompressionAlgorithm: openpgp.enums.compression.zlib
			}
    });
	return decrypted;
}

/**
*  Function sends array with wp objects and encrypted txt.
*
* @param 	{Array} objects 		- An array with objects containing the following fields: id, txt, txt_encrypted.
* @param 	{String} tabId 			- The corresponding tab where the information had been send from.
* @return 	{void} 					- Just fire and forget.
***/
function encryptObjectsTxtForTab(objects, tabId) {
	const encryptionPromises = [];	
	for (const obj of objects) {
		encryptionPromises.push(openpgpEncrypt(obj.txt, sessionEncryptionKey.publicKey));
	}
	Promise.all(encryptionPromises)
		.then((responses) => {
			for (let i = 0; i < responses.length; i++) {
				objects[i].txt_encrypted = responses[i];
			}
			sendMessageToTab('encryptedObjectsTxt', objects, tabId);
		});
}

/**
*  Function replaces clipboard with encrypted txt.
*
* @param 	{Object} selection 			- An object containing the following fields: title, txt, txt_encrypted.
* @param	{Boolean} isShowingToast 	- Show toast with encrypted text.
* @return 	{void} 						- Just fire and forget.
***/
function encryptObjectsTxtForClipboard(selection, isShowingToast) {

	const encryptionPromise = openpgpEncrypt(selection.txt, sessionEncryptionKey.publicKey);

	encryptionPromise
		.then((res) => {
			selection.txt_encrypted = res;
			if (isShowingToast) {
				showToast(selection.title, selection.txt_encrypted);
			}
			replaceClipboard(selection.txt_encrypted);
		});
}

/**
*  Function replaces clipboard with decrypted txt.
*
* @param 	{Object} selection 			- An object containing the following fields: title, txt, txt_encrypted.
* @param	{Boolean} isShowingToast 	- Show toast with encrypted text.
* @return 	{void} 						- Just fire and forget.
***/
function decryptObjectsTxtForClipboard(selection, isShowingToast) {
	
	
	let cleanSelectionTxt = selection.txt.trim();
	if ((cleanSelectionTxt == null) || (cleanSelectionTxt === '') || ((cleanSelectionTxt.substring(0, 27) !== '-----BEGIN PGP MESSAGE-----') && (cleanSelectionTxt.substring(0, 21) !== '—–BEGIN PGP MESSAGE—–'))) {
		showToast('Error - decryption failed', 'Selected text is missing its relevant tags.');
	} 
	
	// try to erase format errors
	if (cleanSelectionTxt.substring(0, 27) === '-----BEGIN PGP MESSAGE-----') {
		cleanSelectionTxt = cleanSelectionTxt.substring(27, cleanSelectionTxt.length - 25);
		cleanSelectionTxt = cleanSelectionTxt.replaceAll(' ', '\n');
		cleanSelectionTxt = '-----BEGIN PGP MESSAGE-----\n' + cleanSelectionTxt + '-----END PGP MESSAGE-----\n';
	} else if (cleanSelectionTxt.substring(0, 21) === '—–BEGIN PGP MESSAGE—–') {
		cleanSelectionTxt = cleanSelectionTxt.substring(21, cleanSelectionTxt.length - 19);
		cleanSelectionTxt = cleanSelectionTxt.replaceAll(' ', '\n');
		cleanSelectionTxt = '-----BEGIN PGP MESSAGE-----\n' + cleanSelectionTxt + '-----END PGP MESSAGE-----\n';
	}
	selection.txt = cleanSelectionTxt;
	const decryptionPromise = openpgpDecrypt(selection.txt, sessionDecryptionKey.privateKey, null, sessionDecryptionKey.passphrase)
		.catch((err) => {
			console.error(err);
		});

	decryptionPromise
		.then((res) => {
			selection.txt_decrypted = res;
			if (selection.txt_decrypted == null) {
				showToast('Error - decryption failed', 'Could not decrypt the selected text. Maybe you are using a wrong key or selection?');
				return;
			} 
			if (isShowingToast) {
				showToast(selection.title, selection.txt_decrypted.data);
			}
			replaceClipboard(selection.txt_decrypted.data);
		});
}

/**
*  Function replaces clipboard with txt.
*
* @param 	{String} txt 			- Text which should be inserted into clipboard.
* @return 	{void} 					- Just fire and forget.
***/
function replaceClipboard(txt) {
	navigator.clipboard.writeText(txt)
		.then((res) => {
		});
}


/**
*  Function returns array with wp objects and decrypted txt.
*
* @param 	{Array} objects 		- An array with objects containing the following fields: id, txt, txt_decrypted.
* @param 	{String} tabId 			- The corresponding tab where the information had been send from.
* @return 	{void} 					- Just fire and forget.
***/
function decryptObjectsTxtForTab(objects, tabId) {
	const decryptionPromises = [];	
	for (const obj of objects) {
		const promise = openpgpDecrypt(obj.txt, sessionDecryptionKey.privateKey, null, sessionDecryptionKey.passphrase)
			.catch((err) => {
				console.error(err);
			});
		decryptionPromises.push(promise);
	}
	Promise.all(decryptionPromises)
		.then((res) => {
			for (let i = 0; i < res.length; i++) {
				if (res[i] instanceof Error) {
					throw res[i];					
				}
				objects[i].txt_decrypted = res[i].data;
			}

			sendMessageToTab('decryptedObjectsTxt', objects, tabId);
		})
		.catch((err) => {
			console.error('[ERROR] (background script): ');
			console.error(err);
			portFromPopup.postMessage({type: 'error', data: {srcFeedDivId: '', txt: 'Failure during decryption. Maybe the chosen key was wrong!'}});
		});
}

/**
* Download file in json format to the browser Downloads location.
*
* @param 	{String} jsonDownload 	- Encrypted UserKeyBundle.
* @return 	{void} 					- Just fire and forget.
***/
async function downloadJsonFile(jsonDownload) {
	let blob = new Blob([jsonDownload.content], {type: 'application/json;charset=utf-8'});
	jsonDownload.url = window.URL.createObjectURL(blob);
	
	let downloading = browser.downloads.download({
		'url': jsonDownload.url,
		'filename': jsonDownload.filename,
		'conflictAction': 'uniquify'
	});
}

/**
* Use local storage to check health of master key.
*
* @param 	{String} targetDivId 	- Optional target for popup.js.
* @param 	{String} srcFeedDivId 	- The responsible div which should handle feedback.
* @return 	{void} 					- Just fire and forget.
***/
function checkMasterKey(srcFeedDivId, targetDivId) {
	
	try {
		browser.storage.local.get({'userKeyBundles': null})
			.then((res) => {
				if (res.userKeyBundles != null) {
					const dUserKeyBundlePromises = [];						
					// create array of decrypted promises with current password
					for (let i = 0; i < res.userKeyBundles.length; i++) {						
						dUserKeyBundlePromises.push(openpgpSymDecrypt(res.userKeyBundles[i], sessionMasterKey));
					}
					Promise.all(dUserKeyBundlePromises)
						.then((resDecrypted) => {
							// all fine, change target
							if (targetDivId != null) {
								portFromPopup.postMessage({type: 'switchPopupDiv', data: targetDivId});
							}
						})
						.catch((errDecrypted) => {
							console.error('[ERROR] (background script): Failure during decryption. Maybe the given key was wrong!');
							console.error(errDecrypted);
							portFromPopup.postMessage({type: 'error', data: {srcFeedDivId: srcFeedDivId, txt: 'Sorry, it seems that the given key was wrong!'}});
						});
				} else {
					// no encrypted data found, so we are fine
				}	
			})
			.catch((errStorage) => {
				console.error('[ERROR] (options script): ');
				console.error(errStorage);
				portFromPopup.postMessage({type: 'error', data: {srcFeedDivId: srcFeedDivId, txt: errStorage}});				
			});
			
	} catch (err) {
		console.error('[ERROR] (background script): ');
		console.error(err);
		portFromPopup.postMessage({type: 'error', data: {srcFeedDivId: srcFeedDivId, txt: err}});
	}
}

/**
* Use local storage to store a newly encrypted user key bundle.
*
* @param 	{String} srcDivId 	- The responsible div which should handle feedback.
* @param 	{String} newPassword 	- The new password which should be used for encryption.
* @param 	{Array} userKeyBundles 	- The array with the stored user key bundles.
* @return 	{void} 					- Just fire and forget.
***/
function restoreUserKeyBundles(srcDivId, newPassword, userKeyBundles) {

	const dUserKeyBundlePromises = [];						
	// create array of decrypted promises with current password
	for (let i = 0; i < userKeyBundles.length; i++) {						
		dUserKeyBundlePromises.push(openpgpSymDecrypt(userKeyBundles[i], sessionMasterKey));
	}
	Promise.all(dUserKeyBundlePromises)
		.then((resDecrypted) => {

			// remove existing storage
			browser.storage.local.remove('userKeyBundles')
				.then((resRemoved) => {
					// set new session password
					sessionMasterKey = newPassword;
					// encrypt and store encrypted data into local storage
					for (let i = 0; i < resDecrypted.length; i++) {
						// create promise for encryption using the new password
						const getEncrypted = openpgpSymEncrypt(resDecrypted[i].data, newPassword);
						// catch async object
						getEncrypted
							.then((resEncrypted) => {
								// store newly encrypted bundle in local storage
								storeUserKeyBundleLocal(resEncrypted);
							});
					}
				})
				.catch((errRemoved) => {
					portFromPopup.postMessage({type: 'error', data: {srcDivId: srcDivId, txt: errRemoved}});
					console.error('[ERROR] (options script): ');
					console.error(errRemoved);									
				});
					
		})
		.catch((errDecrypted) => {
			portFromPopup.postMessage({type: 'error', data: {srcDivId: srcDivId, txt: 'Failure during decryption. Maybe the given key was wrong!'}});
			console.error('[ERROR] (background script): Failure during decryption. Maybe the used key was wrong!');
			console.error(errDecrypted);
		});
}

/**
* Async function returns promise with an symmetrical decrypted string.
* @param 	{String} str 	- The string to encrypt.
* @param 	{String} pass 	- The password used by the encryption.
* @return 	{Promise} 		- Promise including the decrypted str value.
*
* TODO: Function was copied from popup.js
***/
async function openpgpSymDecrypt(str, pass) {
	const message = await openpgp.readMessage({ armoredMessage: str });
	const decrypted = await openpgp.decrypt({
		message, // input as Message object
		passwords: [pass], // multiple passwords possible
		format: 'armored', // ASCII armor (other options: binary, object)
		config: { 
			preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256, 
			preferredCompressionAlgorithm: openpgp.enums.compression.zlib
			}
	});
	return decrypted;
}

/**
* Async function returns promise with an symmetrical encrypted string.
* @param 	{String} str 	- The string to encrypt.
* @param 	{String} pass 	- The password which should be used for the encryption.
* @return 	{Promise} 		- Promise including the encrypted str value.
*
* TODO: Functions is copied from popup.js
***/
async function openpgpSymEncrypt(str, pass) {
	const message = await openpgp.createMessage({ text: str });
	const encrypted = await openpgp.encrypt({
		message, // input as Message object
		passwords: [pass], // multiple passwords possible
		format: 'armored', // ASCII armor (other options: binary, object)
		config: { 
			preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256, 
			preferredCompressionAlgorithm: openpgp.enums.compression.zlib
			}
	});
	return encrypted;
}

/**
* Use local storage to store a newly encrypted user key bundle.
* @param 	{String} encryptedUserKeyBundle 	- The stringified encrypted Object.
* @return 	{void} 								- Just fire and forget.
*
* TODO: Function was copied from popup.js
***/
function storeUserKeyBundleLocal(encryptedUserKeyBundle) {
	
	try {
		browser.storage.local.get({'userKeyBundles': null})
			.then((res) => {
				if(res.userKeyBundles == null) {
					browser.storage.local.set({ 'userKeyBundles': [encryptedUserKeyBundle] });
				} else {
					// TODO: duplicate check makes no sense
					// openPGP adds a header with timestamp or similar and output always differ
					if (res.userKeyBundles.indexOf('encryptedUserKeyBundle') == -1) {
						res.userKeyBundles.push(encryptedUserKeyBundle);
						browser.storage.local.set({ 'userKeyBundles': res.userKeyBundles });
					} else {
						console.log('[INFO] (options script): Duplicate detected and entry skipped!');
					}						
				}
			});
		
	} catch (err) {
		portFromPopup.postMessage({type: 'error', data: {srcFeedDivId: '', txt: err}});
		console.error('[ERROR] (background script): ');
		console.error(err);
	}
}

/**
* Send message to the inject_encryption.js running in a tab.
*
* @param 	{String} mType 	- Type of the message.
* @param 	{String} mData 	- Data of the message.
* @param 	{String} tabId 	- Id from the receiver tab.
* @return 	{void} 			- Just fire and forget.
***/
function sendMessageToTab(mType, mData, tabId) {
	browser.tabs.sendMessage(tabId, {type: mType, data: mData})
		.then((res) => {
			if (res != null) {
				if (res.type === 'encryptObjectsTxt') {
					// TODO: do something
					console.log(res);
				} else {
					// TODO: Some error handling
					console.log(res);
				}
			}
		})
		.catch((err) => {
			console.error('[ERROR] (background script): ');
			console.error(err);
		});
}

/**
* Broadcast messages to the inject_encryption.js running in tabs.
*
* @param 	{String} mType 	- Type of the message.
* @param 	{String} mData 	- Data of the message.
* @return 	{void} 			- Just fire and forget.
***/
function broadcastMessageToTabs(mType, mData) {
	browser.tabs.query({currentWindow:true, active: true}).then((tabs) => {
		for (const tab of tabs) {
			browser.tabs.sendMessage(tab.id, {type: mType, data: mData})
				.then((res) => {
					if (res.type === 'greeting') {
						console.log('[INFO] (background script) received greeting message from content script in tab ' + tab.id + '.');
						console.log(res);
					} else if (res.type === 'encryptObjectsTxt') {
						console.log('[INFO] (background script) received encryptObjectsTxt message from content script in tab ' + tab.id + '.');
						console.log(res);
						encryptObjectsTxtForTab(res.data, tab.id);
					} else if (res.type === 'decryptObjectsTxt') {
						console.log('[INFO] (background script) received decryptObjectsTxt message from content script in tab ' + tab.id + '.');
						console.log(res);
						decryptObjectsTxtForTab(res.data, tab.id);
					} else if (res.type === 'error') {
						console.log('[INFO] (background script) received error message from content script in tab ' + tab.id + '.');
						console.log(res);
						portFromPopup.postMessage({type: 'error', data: {srcFeedDivId: '', txt: res.data}});
					} else {
						console.error('[ERROR] (background script): Got an unexpected answer from tab:');
						console.error(res);
					}
				})
				.catch((err) => {
					console.error('[ERROR] (background script): ');
					console.error(err);
				});
		}
	});
}

/**
* Shows a notification toast in current context.
*
* @param 	{String} mTxt 	- Data of the message.
* @return 	{void} 			- Just fire and forget.
*
* TODO: add buttons (are not working in firefox right now?)
***/
function showToast(mTitle, mBody) {
	browser.notifications.create('toastMessage' ,{
		type: 'basic',
		iconUrl: browser.runtime.getURL('icons/icon_128.png'),
		title: mTitle,
		message: mBody,
	});;
}

/**
* Listen for clicks at the context menu
***/	
browser.contextMenus.onClicked.addListener((info, tab) => {
	switch (info.menuItemId) {
		case 'encrypt-selection':
			if (sessionMasterKey == null) {
				showToast('Error - Your session has been lost', 'Your Masterkey could not be found. Please use the main menu to reinstantiate session.');
				break;
			} else if (sessionEncryptionKey == null) {
				showToast('Error - Your session has been lost', 'Your KeyBundle for Encryption could not be found. Please use the main menu to reinstantiate session.');
				break;
			}
			encryptObjectsTxtForClipboard({title: 'Meow! Copied your encrypted selection to clipboard:', txt: info.selectionText}, true);
			
			break;
		case 'decrypt-selection':
			if (sessionMasterKey == null) {
				showToast('Error - Your session has been lost', 'Your Masterkey could not be found. Please use the main menu to reinstantiate session.');
				break;
			} else if (sessionDecryptionKey == null) {
				showToast('Error - Your session has been lost', 'Your KeyBundle for Decryption could not be found. Please use the main menu to reinstantiate session.');
				break;
			}
			decryptObjectsTxtForClipboard({title: 'Meow! Copied your decrypted selection to clipboard:', txt: info.selectionText}, true);
			break;
		case 'import-json':
			if (sessionMasterKey == null) {
				showToast('Error - Your session has been lost', 'Your Masterkey could not be found. Please use the main menu to reinstantiate session.');
				break;
			}
			elFile.click();
			//decryptObjectsTxtForClipboard({title: 'Meow! Copied your decrypted selection to clipboard:', txt: info.selectionText}, true);
			break;
	}
	
	//popupDecrypt(info.selectionText);
});

/**
* Import a key using a user given json file.
*
* @return {void} 		- Just fire and forget.
***/
function importUserKeys() {
	if (!elFile.files.length) {
		showToast('Error - No file found', 'Could not find any file. Please select a valid JSON-File!');
	}  else {
		let afiles = elFile.files;
		const jsonReader = new FileReader();
				
		for (let i = 0; i < afiles.length; i++) {
			console.log(afiles[i]);
			// trigger event listener
			jsonReader.readAsText(afiles[i]);
		}
		// event listener for our file reader
		jsonReader.addEventListener('load', function () {
			
			const fileTxt = jsonReader.result;
			// check json health and add given legit key
			try {
				const jsonObj = JSON.parse(fileTxt);
				if (jsonObj.name == null) {
					showToast('Error - Not a valid JSON file', 'The "name" attribute could not be found in the given JSON file.');
				} else if (jsonObj.description == null) {
					showToast('Error - Not a valid JSON file', 'The "description" attribute could not be found in the given JSON file.');
				} else if (jsonObj.passphrase == null) {
					showToast('Error - Not a valid JSON file', 'The "passphrase" attribute could not be found in the given JSON file.');
				} else if (jsonObj.privateKey == null) {
					showToast('Error - Not a valid JSON file', 'The "privateKey" attribute could not be found in the given JSON file.');
				} else if (jsonObj.publicKey == null) {
					showToast('Error - Not a valid JSON file', 'The "publicKey" attribute could not be found in the given JSON file.');
				} else {
				// key seems legit
					// create promise for encryption using the session password
					const getEncrypted = openpgpSymEncrypt(JSON.stringify(jsonObj), sessionMasterKey);
					// catch async object
					getEncrypted
						.then((resEncrypted) => {
							// store newly encrypted bundle in local storage
								storeUserKeyBundleLocal(resEncrypted);
							});
				}
				showToast('Meow, key import succeed!', 'Your JSON file has been imported successfully.')
			} catch (err) {
				showToast('Error - Not a valid JSON file', err.toString());
			}
		});
	}		
}

/**
* Listen for Connections and init
***/
browser.runtime.onConnect.addListener(function(port) {
	
	// register hidden input field in background.html
	elFile = document.getElementById('inp-popup-addkey');
	// change could be triggered by using context menu
	// TODO: try again to enable the same action through the popup menu
	elFile.addEventListener('change', function () {importUserKeys();}, false);

	portFromPopup = port;
	portFromPopup.postMessage({type: 'greeting', data: 'ehlo from background script'});
	portFromPopup.postMessage({type: 'resync', data: {'masterKey': sessionMasterKey, 'encryptionKey': sessionEncryptionKey, 'decryptionKey': sessionDecryptionKey}});
	broadcastMessageToTabs('greeting', 'ehlo from background script');
	portFromPopup.onMessage.addListener((msg, cb) => {
			
			if (msg.type === 'greeting') {
				console.log('[INFO] (background script) received message from popup script: ');
				console.log(msg);
			} else if (msg.type === 'resync') {
				console.log('[INFO] (background script) received resync message from popup script: ');
				console.log(msg);
				portFromPopup.postMessage({type: 'resync', data: {'masterKey': sessionMasterKey, 'encryptionKey': sessionEncryptionKey, 'decryptionKey': sessionDecryptionKey}});
			} else if (msg.type === 'download') {
				console.log('[INFO] (background script) received download message from popup script.');
				console.log(msg);
				downloadJsonFile(msg.data);
			} else if (msg.type === 'addMasterKey') {
				console.log('[INFO] (background script) received addMasterKey message from popup script.');
				console.log(msg);
				sessionMasterKey = msg.data.key;
			} else if (msg.type === 'resyncMasterKey') {
				console.log('[INFO] (background script) received resyncMasterKey message from popup script.');
				console.log(msg);
				sessionMasterKey = msg.data.key;
				checkMasterKey(msg.data.srcFeedDivId, msg.data.targetDivId);
			}  else if (msg.type === 'resyncEncryptionKey') {
				console.log('[INFO] (background script) received resyncEncryptionKey message from popup script.');
				console.log(msg);
				sessionEncryptionKey = msg.data;
			} else if (msg.type === 'resyncDecryptionKey') {
				console.log('[INFO] (background script) received resyncDecryptionKey message from popup script.');
				console.log(msg);
				sessionDecryptionKey = msg.data;
			} else if (msg.type === 'encryptTarget') {
				console.log('[INFO] (background script) received encryptTarget message from popup script.');
				console.log(msg);
				sessionEncryptTarget = msg.data;
				broadcastMessageToTabs('encryptTarget', sessionEncryptTarget);
			} else if (msg.type === 'decryptTarget') {
				console.log('[INFO] (background script) received decryptTarget message from popup script.');
				console.log(msg);
				sessionDecryptTarget = msg.data;
				broadcastMessageToTabs('decryptTarget', sessionDecryptTarget);
			} else if (msg.type === 'changeMasterKey') {
				console.log('[INFO] (background script) received changeMasterKey message from option script.');
				console.log(msg);
				sessionMasterKey = msg.data.masterKey;
				restoreUserKeyBundles(msg.data.srcDivId, msg.data.newMasterKey, msg.data.userKeyBundles);
			} else {
				console.log('[ERROR] (background script) received malformed message from popup script: ');
				console.log(msg);
			}
		});
		
});

/**
* Init on install
* enable context menu for encryption/decryption
***/
browser.runtime.onInstalled.addListener(function() {
	
	// create target options
	let targetOptions = [];
	targetOptions.push({
		name: 'wordpress',
		description: 'automatic wordpress encryption/decryption',
	});
	// TODO: implement twitter
	/*
	targetOptions.push({
		name: 'twitter',
		description: 'automatic twitter encryption/decryption',
	});
	*/
	
	browser.storage.local.set({ 'targetOptions': targetOptions });
	// create and init context menu
	browser.contextMenus.create({
		id: 'encrypt-selection', 
		title: 'Encrypt to Clipboard (session key)', 
		contexts: ['selection']
		});
	browser.contextMenus.create({
		id: 'decrypt-selection', 
		title: 'Decrypt to Clipboard (session key)', 
		contexts: ['selection']
		});
	browser.contextMenus.create({
		id: 'import-json', 
		title: 'Import Keys using a JSON-File', 
		contexts: ['all']
		});	
	//let imported = document.createElement('script');
	//imported.src = '/openpgp.min.js';
	//document.body.appendChild(imported);
});