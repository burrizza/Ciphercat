'use strict';

let myPort;
let sessionMasterKey;
let sessionEncryptionKey;
let sessionDecryptionKey;

/**
* Select a key from local storage according to its position and render encryption/decryption options.
*
* @param 	{String} popupDivId 	- The id from div which should be rendered initial.
* @param 	{String} elementFragId	- Used to identify the right element in document (ex.: listkeys).
* @return 	{void} 					- Just fire and forget.
***/
function submitSelectedLocalUserKey(popupDivId, elementFragId) {

	try {
		browser.storage.local.get({'userKeyBundles': null})
		.then((res) => {

			if((res.userKeyBundles == null) || (res.userKeyBundles.length == null)) {
				//TODO: NO KEYS in DB
			} else {
				let length = res.userKeyBundles.length;
				let isChecked = false;
				// check 3 elements and get selection
				for (let i = 1; i < 4; i++) {
					let elInput = document.getElementById('inp-' + elementFragId + '-key'+i);
					let elLabel = document.getElementById('lbl-' + elementFragId + '-key'+i);
					if (elInput.checked) {
						isChecked = true;
						let elLabelBody = elLabel.getElementsByTagName('span')[0];
						let posChecked = elLabelBody.textContent.split(';')[0].substring(3);
						
						const getDecrypted = openpgpSymDecrypt(res.userKeyBundles[posChecked-1], sessionMasterKey);
						
						if (popupDivId === 'div-popup-enc-targets') {
							// store encrypted object into local storage
							// TODO: use local storage with favorites later
							browser.storage.local.set({ 'userEncryptionKey': res.userKeyBundles[posChecked-1] });
							// cache decrypted object into background.js
							getDecrypted
								.then((res) => {
									// catch deccrypted message
									sessionEncryptionKey = JSON.parse(res.data);
									// send message to background.js
									myPort.postMessage({type: 'resyncEncryptionKey', data: sessionEncryptionKey});
									// render target options in same div
									renderListTargetOptions(1, 'div-popup-enc-targets', 'enc-targets', 'all');
								});	
						} else {
							// store encrypted object into local storage
							// TODO: use local storage with favorites later
							browser.storage.local.set({ 'userDecryptionKey': res.userKeyBundles[posChecked-1] });
							// cache decrypted object into background.js
							getDecrypted
								.then((res) => {
									// catch deccrypted message
									sessionDecryptionKey = JSON.parse(res.data);
									// send message to background.js
									myPort.postMessage({type: 'resyncDecryptionKey', data: sessionDecryptionKey});
									// render target options in same div
									renderListTargetOptions(1, 'div-popup-dec-targets', 'dec-targets', 'all');
								});	
						}
						
							
						break;
					}
				}
				// no key selected
				if (!isChecked) {		
					if (popupDivId === 'div-popup-enc-targets')
						switchPopupDiv('div-popup-enc-listkeys');
					else {
						switchPopupDiv('div-popup-dec-listkeys');
					}
				}
			}
		});
	} catch (err) {
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Download a key from local storage according to its position.
*
* @return 	{void} 					- Just fire and forget.
***/
function downloadSelectedLocalUserKey() {
	try {
		browser.storage.local.get({'userKeyBundles': null})
		.then((res) => {

			if((res.userKeyBundles == null) || (res.userKeyBundles.length === 0)) {
				//TODO: NO KEYS in DB
			} else {
				let length = res.userKeyBundles.length;
				// only 3 items will be rendered at a time
				for (let i = 1; i < 4; i++) {
					let elInput = document.getElementById('inp-listkeys-key'+i);
					let elLabel = document.getElementById('lbl-listkeys-key'+i);

					if (elInput.checked) {
						let elLabelBody = elLabel.getElementsByTagName('span')[0];
						let posChecked = elLabelBody.textContent.split(';')[0].substring(3);
						
						const getDecrypted = openpgpSymDecrypt(res.userKeyBundles[posChecked-1], sessionMasterKey);
						getDecrypted
							.then((res) => {
								// catch deccrypted message
								let userKeyBundle = JSON.parse(res.data);
								let jsonDownload = {'filename': 'keybundle-' + userKeyBundle.name + '.json', 'content': JSON.stringify(userKeyBundle) };
								// send message to background.js
								myPort.postMessage({type: 'download', data: jsonDownload});
							});	
							
						break;
					}
				}
			}
		});
	} catch (err) {
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Remove a key from local storage by using its label.
*
* @return {void} 		- Just fire and forget.
***/
function removeSelectedLocalUserKey() {
	try {
		browser.storage.local.get({'userKeyBundles': null})
			.then((res) => {
				if((res.userKeyBundles == null) || (res.userKeyBundles.length === 0)) {
					//TODO: NO KEYS in DB
				} else {
					let length = res.userKeyBundles.length;
					// only 3 items will be rendered at a time
					for (let i = 0; i < 3; i++) {
						let elInput = document.getElementById('inp-listkeys-key'+(i + 1));
						let elLabel = document.getElementById('lbl-listkeys-key'+(i + 1));
						if (elInput.checked) {
							let elLabelBody = elLabel.getElementsByTagName('span')[0];
							let posChecked = elLabelBody.textContent.split(';')[0].substring(3);
							// remove position from array (why inverted params?)
							let newRes = res.userKeyBundles;
							newRes.splice(posChecked - 1, 1);
							browser.storage.local.set({ 'userKeyBundles': newRes });
							break;
						}
					}
					// reload list
					renderListKeys(1, 'div-popup-listkeys', 'listkeys', 'all');
				}
		});
	} catch (err) {
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Select a target option from local storage according to its position and execute it.
*
* @param 	{String} popupDivId 	- The id from div which should be rendered initial.
* @param 	{String} elementFragId 	- Used to identify the right element in document (ex.: listkeys).
* @return 	{void} 					- Just fire and forget.
***/
function submitSelectedLocalTargetOpt(popupDivId, elementFragId) {
	try {
		browser.storage.local.get({'targetOptions': null})
		.then((res) => {

			if((res.targetOptions == null) || (res.targetOptions.length === 0)) {
				//TODO: NO options in DB
			} else {
				let length = res.targetOptions.length;
				// check 3 elements and get selection
				for (let i = 1; i < 4; i++) {
					let elInput = document.getElementById('inp-' + elementFragId + '-opt'+i);
					let elLabel = document.getElementById('lbl-' + elementFragId + '-opt'+i);
					if (elInput.checked) {
						let elLabelBody = elLabel.getElementsByTagName('span')[0];
						let posChecked = elLabelBody.textContent.split(';')[0].substring(3);
						
						if (elementFragId === 'enc-targets') {
							let userEncryptionTarget = res.targetOptions[posChecked-1]
							// store encrypted object into local storage TODO: use local storage
							browser.storage.local.set({ 'userEncryptionTarget': userEncryptionTarget });
							// send message to background.js
							myPort.postMessage({type: 'encryptTarget', data: userEncryptionTarget});
						} else {
							let userDecryptionTarget = res.targetOptions[posChecked-1]
							// store encrypted object into local storage TODO: use local storage
							browser.storage.local.set({ 'userDecryptionTarget': userDecryptionTarget });
							// send message to background.js
							myPort.postMessage({type: 'decryptTarget', data: userDecryptionTarget});
						}
						
						break;
					}
				}
				// go back to index
				switchPopupDiv(popupDivId);
			}
		});
	} catch (err) {
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Render target options.
*
* @param 	{String} startNumber 	- The starting number corresponding to the positions in array.
* @param 	{String} popupDivId 	- The id from div which should be rendered initial.
* @param 	{String} elementFragId 	- Used to identify the right element in document (ex.: listkeys).
* @param 	{String} selection 		- all, encrypt (eq. all), decrypt.
* @return 	{void} 					- Just fire and forget.
***/
function renderListTargetOptions(startNumber, popupDivId, elementFragId, selection) {
		
	// get div in <form>
	let elInput1= document.getElementById('inp-' + elementFragId + '-opt1');
	let elInput2= document.getElementById('inp-' + elementFragId + '-opt2');
	let elInput3= document.getElementById('inp-' + elementFragId + '-opt3');
	let elLabel1 = document.getElementById('lbl-' + elementFragId + '-opt1');
	let elLabel2 = document.getElementById('lbl-' + elementFragId + '-opt2');
	let elLabel3 = document.getElementById('lbl-' + elementFragId + '-opt3');
	
	if(sessionMasterKey == null) {
		//TODO: SESSION INACTIVE
	} else {
		try {
			// get target options list from storage
			browser.storage.local.get({'targetOptions': null})
				.then((res) => {
					if ((res.targetOptions == null) || (res.targetOptions.length === 0)) {
						let elNextButton = document.getElementById('but-' + elementFragId + '-next');
						elNextButton.style.display = 'none';
						//TODO: NO options in DB
					} else {
						
						let nextStartNumber = startNumber + 3;
						let targetOptionsLength = res.targetOptions.length;
						
						// register next button
						document.getElementById('but-' + elementFragId + '-next')
							.addEventListener('click', function () {renderListTargetOptions(nextStartNumber, popupDivId, elementFragId, selection);});
						let elNextButton = document.getElementById('but-' + elementFragId + '-next');
						// hide unused list elements (page always renders 3)
						if (targetOptionsLength < 3) {
							let thisFragmentCount = targetOptionsLength;
							
							
							for (let i = 3; i > thisFragmentCount; i--) {
								let elInput = document.getElementById('inp-' + elementFragId + '-opt'+i);
								let elLabel = document.getElementById('lbl-' + elementFragId + '-opt'+i);

								elInput.style.display = 'none';
								elLabel.style.display = 'none';
							}
							// hide next button
							let elNextButton = document.getElementById('but-' + elementFragId + '-next');
							elNextButton.style.display = 'none';
							
							nextStartNumber = targetOptionsLength + 1;
						} else {
							for (let i = 1; i < 4; i++) {
								let elInput = document.getElementById('inp-' + elementFragId + '-opt'+i);
								let elLabel = document.getElementById('lbl-' + elementFragId + '-opt'+i);

								elInput.style.display = 'block';
								elLabel.style.display = 'block';
							}
							// show next button
							if (targetOptionsLength > 3) {
								elNextButton.style.display = 'block';
							} else {
								elNextButton.style.display = 'none';
							}								
							
						}
						let clusterLength = (nextStartNumber - 1) % 3;
						if (clusterLength === 0) {
							clusterLength = 3;
						}
						for (let i = 0; i < clusterLength; i++) {
							
							let a = i+1;
							let elInput = document.getElementById('inp-' + elementFragId + '-opt'+a);
							let elLabel = document.getElementById('lbl-' + elementFragId + '-opt'+a);
							let elLabelHead = elLabel.getElementsByTagName('strong')[0];
							let elLabelBody = elLabel.getElementsByTagName('span')[0];
														
							elLabelHead.textContent = res.targetOptions[i].name;
							elLabelBody.textContent = 'ID: ' + (startNumber + i) + ';Description: ' + res.targetOptions[i].description;
						}
					}
				});
		} catch (err) {
			console.error('[ERROR] (popup script): ');
			console.error(err);	
		}			
	}
}

/**
* Render list of userkeys.
*
* @param 	{String} startNumber 	- The starting number corresponding to the positions in array.
* @param 	{String} popupDivId 	- The id from div which should be rendered initial.
* @param 	{String} elementFragId 	- Used to identify the right element in document (ex.: listkeys).
* @param 	{String} selection 		- all, encrypt (eq. all), decrypt.
* @return 	{void} 					- Just fire and forget.
***/
function renderListKeys(startNumber, popupDivId, elementFragId, selection) {

	// get div in <form>
	let elInput1= document.getElementById('inp-' + elementFragId + '-key1');
	let elInput2= document.getElementById('inp-' + elementFragId + '-key2');
	let elInput3= document.getElementById('inp-' + elementFragId + '-key3');
	let elLabel1 = document.getElementById('lbl-' + elementFragId + '-key1');
	let elLabel2 = document.getElementById('lbl-' + elementFragId + '-key2');
	let elLabel3 = document.getElementById('lbl-' + elementFragId + '-key3');
	
	let elNextButton = document.getElementById('but-' + elementFragId + '-next');
	let elSelectButton = document.getElementById('but-' + elementFragId + '-select');
	let elRemoveButton = document.getElementById('but-' + elementFragId + '-rem');
	let elExpButton = document.getElementById('but-' + elementFragId + '-exp');
	
	try {
		// get encrypted key list from storage
		browser.storage.local.get({'userKeyBundles': null})
			.then((res) => {
							
				if((res.userKeyBundles == null) || (res.userKeyBundles.length === 0)) {
					//TODO: NO KEYS in DB
					elNextButton.style.display = 'none';
					if (elSelectButton !=  null) {
						elSelectButton.style.display = 'none';
					}
					if (elRemoveButton != null) {
						elRemoveButton.style.display = 'none';
						elExpButton.style.display = 'none';
					}
								

				} else {

					elInput1.style.display = 'block';
					elLabel1.style.display = 'block';
					elInput2.style.display = 'block';
					elLabel2.style.display = 'block';
					elInput3.style.display = 'block';
					elLabel3.style.display = 'block';
					
					
					if (elSelectButton !=  null) {
						elSelectButton.style.display = 'block';
					}
					if (elRemoveButton != null) {
						elRemoveButton.style.display = 'block';
						elExpButton.style.display = 'block';
					}
					
					elNextButton.style.display = 'block';
					
					const dUserKeyBundle = [];
					const dUserKeyBundlePromises = [];
										
					// create array of promises
					for (let i = startNumber - 1; i < res.userKeyBundles.length; i++) {						
						dUserKeyBundlePromises.push(openpgpSymDecrypt(res.userKeyBundles[i], sessionMasterKey));
					}
					Promise.all(dUserKeyBundlePromises)
						.then((responses) => {
							let cntUserKeyBundles = responses.length;
							
							// create selected arrays and enrich data with position id
							for (let i = 0; i < cntUserKeyBundles; i++) {
								// create decrypted object
								const userKeyBundle = JSON.parse(responses[i].data);
								// add origin position as id
								userKeyBundle.id = i + startNumber;
								
								
								// skip impossible combinations
								if ((selection === 'decrypt') && (userKeyBundle.privateKey === '')) {
									continue;
								} else {
									dUserKeyBundle.push(userKeyBundle);
								}
							}
							
							let nextStartNumber = startNumber + 3;
							let userKeyBundleLength = dUserKeyBundle.length;
							
							// register next button
							document.getElementById('but-' + elementFragId + '-next')
								.addEventListener('click', function () {renderListKeys(nextStartNumber, popupDivId, elementFragId, selection);});
							// hide unused list elements (page always renders 3)
							if (userKeyBundleLength < 3) {
								let thisFragmentCount = userKeyBundleLength;
								
								for (let i = 3; i > thisFragmentCount; i--) {
									let elInput = document.getElementById('inp-' + elementFragId + '-key'+i);
									let elLabel = document.getElementById('lbl-' + elementFragId + '-key'+i);

									elInput.style.display = 'none';
									elLabel.style.display = 'none';
								}
								// hide next button
								elNextButton.style.display = 'none';
								
								nextStartNumber = userKeyBundleLength + 1;
							} else {
								for (let i = 1; i < 4; i++) {
									let elInput = document.getElementById('inp-' + elementFragId + '-key'+i);
									let elLabel = document.getElementById('lbl-' + elementFragId + '-key'+i);

									elInput.style.display = 'block';
									elLabel.style.display = 'block';
								}
								// show next button
								if (cntUserKeyBundles > 3) {
									elNextButton.style.display = 'block';
								} else {
									elNextButton.style.display = 'none';
								}
							}
							let clusterLength = (nextStartNumber - 1) % 3;
							if (clusterLength === 0) {
								clusterLength = 3;
							}
							for (let i = 0; i < clusterLength; i++) {
								
								let a = i+1;
								let elInput = document.getElementById('inp-' + elementFragId + '-key'+a);
								let elLabel = document.getElementById('lbl-' + elementFragId + '-key'+a);
								let elLabelHead = elLabel.getElementsByTagName('strong')[0];
								let elLabelBody = elLabel.getElementsByTagName('span')[0];
																
								elLabelHead.textContent = dUserKeyBundle[i].name;
								elLabelBody.textContent = 'ID: ' + dUserKeyBundle[i].id.toString() + ';Description: ' + dUserKeyBundle[i].description;
							}
						})
						.catch((err) => {
							console.error('[ERROR] (popup script): ');
							console.error(err);
						});
				}
			});
		
	} catch (err) {
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Add an key for the symmetric encryption of all stored keys and information.
*
* @param 	{String} popupDivId 	- The id from div which should be rendered initial.
* @return 	{void} 					- Just fire and forget.
***/
function addMasterKey(popupDivId) {
	
	// reset feedback
	toggleFeedback('-addmkey', 'info', null);
	
	let elPassNew = document.getElementById('inp-addmkey-pass');
	let elPassNew2 = document.getElementById('inp-addmkey-pass2');
	
	
	if (elPassNew.checkValidity() == false) {
		elPassNew.reportValidity();
		toggleFeedback('-addmkey', 'error', 'Please enter your password into the first field.');
		return;
	} else if (elPassNew2.checkValidity() == false) {
		elPassNew2.reportValidity();
		toggleFeedback('-addmkey', 'error', 'Please enter your password into the second field for validation.');
		return;
	} else if (elPassNew.value !== elPassNew2.value) {
		elPassNew2.setCustomValidity('The new given password does not match its validation twin.');
		elPassNew2.reportValidity();
		toggleFeedback('-addmkey', 'error', 'The new given password does not match its validation twin.');
		elPassNew2.setCustomValidity('');
		return;
	} 
	
	sessionMasterKey = elPassNew.value;
	// send message to background.js
	myPort.postMessage({type: 'addMasterKey', data: {targetDivId: popupDivId, key: sessionMasterKey}});
	switchPopupDiv(popupDivId);
}

/**
* Enter current key for the symmetric encryption of all stored keys and information.
*
* @param 	{String} popupDivId 	- The id from div which should be rendered initial.
* @return 	{void} 					- Just fire and forget.
***/
function submitMasterKey(popupDivId) {
	
	// reset feedback
	toggleFeedback('-entermkey', 'info', null);
	
	let elPass = document.getElementById('inp-entermkey-pass');
	
	if (elPass.checkValidity() == false) {
		elPass.reportValidity();
		return;
	} 
	
	sessionMasterKey = elPass.value;
	// send message to background.js
	myPort.postMessage({type: 'resyncMasterKey', data: {srcFeedDivId: '-entermkey', targetDivId: popupDivId,key: sessionMasterKey}});
}

/**
* Async function returns promise with an symmetrical encrypted string.
* @param 	{String} str 	- The string to encrypt.
* @param 	{String} pass 	- The password which should be used for the encryption.
* @return 	{Promise} 		- Promise including the encrypted str value.
*
* TODO: Function should be transfered to background.js.
***/
async function openpgpSymEncrypt(str, pass) {
	const message = await openpgp.createMessage({ text: str });
	try {
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
	} catch (err) {
		showErrorDiv(err);
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Async function returns promise with an symmetrical decrypted string.
* @param 	{String} str 	- The string to encrypt.
* @param 	{String} pass 	- The password used by the encryption.
* @return 	{Promise} 		- Promise including the decrypted str value.
*
* TODO: Function should be transfered to background.js.
***/
async function openpgpSymDecrypt(str, pass) {
	const message = await openpgp.readMessage({ armoredMessage: str });
	
	try {
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
	} catch (err) {
		showErrorDiv(err);
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}


/**
* Async function returns returns promise with our keyset.
*
* @param 	{String} name 	- The name which should be used for the key.
* @param 	{String} pass 	- The password used for the encryption.
* @return 	{Promise} 		- Promise including the decrypted str value.
*
* TODO: Function should be transfered to background.js.
***/
async function openpgpGenerateKey(name, pass) {
	const { privateKey, publicKey, revocationCertificate } = await openpgp.generateKey({
					type: 'ecc',
					curve: 'ed25519',
					userIDs: [{ name: name }],
					passphrase: pass,
					format: 'armored'
					});

	return { privateKey, publicKey, revocationCertificate }
}

/**
* Use local storage to store a newly encrypted user key bundle.
*
* @param 	{String} encryptedUserKeyBundle 	- The stringified object to encrypt.
* @return 	{void} 								- Just fire and forget.
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
						console.log('[INFO] (popup script): Duplicate detected and entry skipped!');
					}						
				}
			});
		
	} catch (err) {
		console.error('[ERROR] (popup script): ');
		console.error(err);
	}
}

/**
* Generate public and private keys and encrypt it symmetrically using openpgp.js.
*
* @return {void} 		- Just fire and forget.
***/
function addKeyBundle() {
	let encryptedUserKeyBundle;
	let elName = document.getElementById('inp-addkey-name');
	let elDesc = document.getElementById('inp-addkey-desc');
	let elPass = document.getElementById('inp-addkey-pass');
	let elPrivKey = document.getElementById('txt-addkey-privateKey');
	let elPubKey = document.getElementById('txt-addkey-publicKey');
	
		
	if (elName.checkValidity() == false) {
		elName.reportValidity();
		toggleFeedback('-addkey', 'error', 'Please enter a Name into its corresponding field.');
	} else if (elPrivKey == null || elPrivKey == '') {
		// set passwordfield to required if private key is set
		elPass.setAttribute("required", "");
		elPass.reportValidity();
		toggleFeedback('-addkey', 'error', 'Please enter a passphrase into its corresponding field.');
	} else if (elPubKey.checkValidity() == false) {
		elPass.reportValidity();
		toggleFeedback('-addkey', 'error', 'Please enter a Public Key into its corresponding field.');
	} else {
		const userKeyBundle = {
			name: elName.value, 
			description: elDesc.value, 
			passphrase: elPass.value,
			privateKey: elPrivKey.value,
			publicKey: elPubKey.value};
		
		// encrypt userKeyBundle objects for protection
		let msg = JSON.stringify(userKeyBundle);
		const getEncrypted = openpgpSymEncrypt(msg, sessionMasterKey);
		// catch async object
		getEncrypted
			.then((res) => {
				// store encrypted bundle in local storage
				storeUserKeyBundleLocal(res);
				// show index div
				switchPopupDiv('div-popup-index');
			});
	
	}
	return encryptedUserKeyBundle;
}

/**
* Generate public and private keys using openpgp.js and user input.
*
* @return 	{Object} 	- Describes users key bundle (name, description, passphrase).
***/
function generateKeys() {
	toggleFeedback('-addkey', 'info', null);
	
	let elName = document.getElementById('inp-addkey-name');
	let elDesc = document.getElementById('inp-addkey-desc');
	let elPass = document.getElementById('inp-addkey-pass');
	let elPrivKey = document.getElementById('txt-addkey-privateKey');
	let elPubKey = document.getElementById('txt-addkey-publicKey');
	
	const userKeyBundle = {name: elName.value, description: elDesc.value, passphrase: elPass.value};
	
	
	// set passwordfield to required
	elPass.setAttribute("required", "");
	
	if (elName.checkValidity() == false) {
		elName.reportValidity();
		toggleFeedback('-addkey', 'error', 'Please enter a Name into its corresponding field.');
	} else if (elPass.checkValidity() == false) {
		elPass.reportValidity();
		toggleFeedback('-addkey', 'error', 'Please enter a Passphrase into its corresponding field.');
	} else {
		const genKeyBundle = openpgpGenerateKey(userKeyBundle.name, userKeyBundle.passphrase);
		// fetch promise from async function
		genKeyBundle
			.then((res) => {
				userKeyBundle['privateKey'] = res.privateKey;
				elPrivKey.value = res.privateKey;
				userKeyBundle['publicKey'] = res.publicKey;
				elPubKey.value = res.publicKey;
				userKeyBundle['revocationCertificate'] = res.revocationCertificate;
			});
		
	}
	
	return userKeyBundle;
}

/**
* Reads users clipboard and pastes data into addkey form.
*
* @return 	{void} 		- Just fire and forget.
***/
function importJSONfromClip() {
	// reset feedback
	toggleFeedback('-addkey', 'info', null);

	let elName = document.getElementById('inp-addkey-name');
	let elDesc = document.getElementById('inp-addkey-desc');
	let elPass = document.getElementById('inp-addkey-pass');
	let elPrivKey = document.getElementById('txt-addkey-privateKey');
	let elPubKey = document.getElementById('txt-addkey-publicKey');
	
	navigator.clipboard.readText()
		.then((res) => {
			// check json health and add given legit key
			try {
				const jsonObj = JSON.parse(res);
				if (jsonObj.name == null) {
					toggleFeedback('-addkey', 'error', 'The "name" attribute could not be found in the given JSON file.');
				} else if (jsonObj.description == null) {
					toggleFeedback('-addkey', 'error', 'The "description" attribute could not be found in the given JSON file.');
				} else if (jsonObj.passphrase == null) {
					toggleFeedback('-addkey', 'error', 'The "passphrase" attribute could not be found in the given JSON file.');
				} else if (jsonObj.privateKey == null) {
					toggleFeedback('-addkey', 'error', 'The "privateKey" attribute could not be found in the given JSON file.');
				} else if (jsonObj.publicKey == null) {
					toggleFeedback('-addkey', 'error', 'The "publicKey" attribute could not be found in the given JSON file.');
				} else {
					elName.value = jsonObj.name;	
					elDesc.value = jsonObj.description;	
					elPass.value = jsonObj.passphrase;	
					elPrivKey.value = jsonObj.privateKey;	
					elPubKey.value = jsonObj.publicKey;
				}
			} catch (err) {
				toggleFeedback('-addkey', 'error', 'No valid JSON in clipboard: ' + err.toString());
			}		
		});
}

/**
* Function to show errors on UI.
* @param 	{String} errorText	- String that describes the error.
* @return 	{void} 				- Just fire and forget.
***/
function showErrorDiv(errorText) {
	switchPopupDiv('div-popup-error');
	document.getElementById('span-error').textContent = 'Error: ' + errorText;
}

/**
* Checks if a masterkey has been used already.
*
* @return 	{boolean} 	- True if a key already has been used.
***/
async function isMasterKeySet() {
	const locUserKeyBundles = await browser.storage.local.get({'userKeyBundles': null});
	if (locUserKeyBundles.userKeyBundles != null) {
		return true;
	} else {
		return false;
	}
}

/**
* Change the current main div shown to user.
*
* @param 	{String} newDivName 	- The id of the div which should be loaded.
* @return 	{void} 					- Just fire and forget.
***/
function switchPopupDiv(newDivName) {
	
	// reset feedback on index div
	toggleFeedback('', 'info', null);
	
	let divSelectionSucceed = true;
		
	if((sessionMasterKey == null) && ((newDivName !== 'div-popup-addmkey') && (newDivName !== 'div-popup-entermkey') && (newDivName !== 'div-popup-index') && (newDivName !== 'div-popup-error'))) {
				
		let origDivName = newDivName;
				
		isMasterKeySet()
			.then((res) => {
				if (res == true) {
					document.getElementById('but-entermkey-add').addEventListener('click', function () {submitMasterKey(origDivName);});
					newDivName = 'div-popup-entermkey';
					// enter newDivName (div-popup-addmkey) with button to origDivName
					switchPopupDiv(newDivName);
				} else {
					// not backend related gui could be just rendered
					// backend related gui have to add the right listener for themselfes
					document.getElementById('but-addmkey-add').addEventListener('click', function () {addMasterKey(origDivName);});
					newDivName = 'div-popup-addmkey';
					// enter newDivName (div-popup-addmkey) with button to origDivName
					switchPopupDiv(newDivName);
				}
			})
			.catch((err) => {
				console.error('[ERROR] (options script): ');
				console.error(err);
			});

		
		divSelectionSucceed = false;
		// async task handles from this point
		return divSelectionSucceed;
	}
	
	// render special views which need backend action
	if (newDivName === 'div-popup-enc-listkeys') {
		renderListKeys(1, newDivName, 'enc-listkeys', 'encrypt');
	} else if (newDivName === 'div-popup-dec-listkeys') {
		renderListKeys(1, newDivName, 'dec-listkeys', 'decrypt');
	} else if (newDivName === 'div-popup-listkeys') {
		renderListKeys(1, newDivName, 'listkeys', 'all');
	} else if (newDivName === 'div-popup-enc-targets'){
		// render targetopts div and catch key value
		submitSelectedLocalUserKey(newDivName, 'enc-listkeys');
	} else if (newDivName === 'div-popup-dec-targets'){
		// render targetopts div and catch key value
		submitSelectedLocalUserKey(newDivName, 'dec-listkeys');
	}
		
	let ldiv, newDiv;
	let divName = 'div-popup-';
	// get all relevant divs and set display to none
	ldiv = document.getElementsByTagName('div');
  	for (let i = 0; i < ldiv.length; i++) {
		if (ldiv[i].id.substring(0, 10) === divName) {
			ldiv[i].style.display = 'none';
		}
  	}
	// select new div
  	newDiv = document.getElementById(newDivName)
	if (newDiv == null) {
		// fallback to errorpage if div could not be found
		if (newDivName !== 'div-popup-error') {
			console.error('[ERROR] (options script): Element with id "' + newDivName + '" not found.');
			showErrorDiv('Element with id "' + newDivName + '" not found.');
		} else {
			console.error('[ERROR] (options script): Element with id "' + newDivName + '" not found.');
		}
		return false;
	} else {
		// set style to grid (visible)
		newDiv.style.display = 'grid';
		return divSelectionSucceed;
	}
}

/**
* Show error underneath current action.
*
* @param 	{String} targetDivId 	- The target of the div to show the feeback in.
* @param 	{String} feedType 		- The type of the feedback (error, warn or info).
* @param 	{String} feedTxt 		- The text of the feedback.
* @return 	{void} 					- Just fire and forget.
***/
function toggleFeedback(targetDivId, feedType, feedTxt) {
	
	let elFeedDiv = document.getElementById('div-form-log-popup' + targetDivId);
	let elFeedSpan = document.getElementById('span-form-log-popup' + targetDivId);
		
	if (feedTxt == null) {
		elFeedDiv.style.display = 'none';
		return;
	}
	
	if (feedType === 'error') {
		elFeedDiv.style.backgroundColor = '#700000';
	} else if (feedType === 'warn') {
		elFeedDiv.style.backgroundColor = '#919300';
	} else if (feedType === 'info') {
		elFeedDiv.style.backgroundColor = '#377E00';
	}
	
	elFeedDiv.style.display = 'block';
	elFeedSpan.textContent = feedTxt;
}

/**
* Register Event Listeners for UI and init variables.
*
* @return 	{void} 		- Just fire and forget.
***/
function registerEventListeners() {

	// inject script in tabs
	browser.tabs.executeScript({file: '/content_scripts/inject_encryption.js'})
		.then((res) => {
			console.log('[INFO] (popup script) injected encryption into tabs.');
		})
		.catch((err) => {
			showErrorDiv(err);
			console.error('[ERROR] (popup script) could not inject encryption in tabs:');
			console.error(err);
		});

	// exchange msgs from and to background.js
	try {
		myPort = browser.runtime.connect({name: 'port-from-popup'});
		myPort.postMessage({type: 'greeting', data: 'ehlo from popup script'});
		
		
		myPort.onMessage.addListener((msg) => {
			if (msg.type === 'greeting') {
				console.log('[INFO] (popup script) received message from background script: ');
				console.log(msg);
			} else if (msg.type === 'resync') {
				console.log('[INFO] (popup script) received resync from background script: ');
				console.log(msg);
				sessionMasterKey = msg.data.masterKey;
				sessionEncryptionKey = msg.data.encryptionKey;
				sessionDecryptionKey = msg.data.decryptionKey;
			} else if (msg.type === 'error') {
				console.log('[INFO] (popup script) received error from background script: ');
				console.log(msg);
				toggleFeedback(msg.data.srcFeedDivId, 'error', msg.data.txt);
			} else if (msg.type === 'switchPopupDiv') {
				console.log('[INFO] (popup script) received switchPopupDiv from background script: ');
				console.log(msg);
				switchPopupDiv(msg.data);
			} else if (msg.type === "error") {
				console.log('[INFO] (popup script) received error from background script: ');
				console.log(msg);
				toggleFeedback(msg.data.srcFeedDivId, 'error', msg.data.txt);
			} else {
				console.log('[ERROR] (popup script) received malformed message from background script: ');
				console.log(msg);
			}
		});
	} catch (err) {
		showErrorDiv(err);
		console.error('[ERROR] (popup script) could not connect to the browser background script:');
		console.error(err);
	}
	
	// closed popup means loosing data (which makes it difficult to interact with files)
	window.addEventListener('unload', function () {console.log('[INFO] (popup script) closing window.');});
		
	document.getElementById('but-index-settings').addEventListener('click', function () {switchPopupDiv('div-popup-settings');});
	document.getElementById('but-settings-addkey').addEventListener('click', function () {switchPopupDiv('div-popup-addkey');});
	document.getElementById('but-addkey-generate').addEventListener('click', function () {generateKeys();});
	document.getElementById('but-addkey-import').addEventListener('click', function () {importJSONfromClip();});
	document.getElementById('but-addkey-add').addEventListener('click', function () {addKeyBundle();});
	document.getElementById('but-settings-listkeys').addEventListener('click', function () {switchPopupDiv('div-popup-listkeys');});
	document.getElementById('but-listkeys-rem').addEventListener('click', function () {removeSelectedLocalUserKey();});
	document.getElementById('but-listkeys-exp').addEventListener('click', function () {downloadSelectedLocalUserKey();});
	// encrypt section
	document.getElementById('but-index-encrypt').addEventListener('click', function () {switchPopupDiv('div-popup-enc-listkeys');});
	document.getElementById('but-enc-listkeys-select').addEventListener('click', function () {switchPopupDiv('div-popup-enc-targets');});	
	document.getElementById('but-enc-targets-select').addEventListener('click', function () {submitSelectedLocalTargetOpt('div-popup-index', 'enc-targets') ;});
	// decrypt section
	document.getElementById('but-index-decrypt').addEventListener('click', function () {switchPopupDiv('div-popup-dec-listkeys');});
	document.getElementById('but-dec-listkeys-select').addEventListener('click', function () {switchPopupDiv('div-popup-dec-targets');});	
	document.getElementById('but-dec-targets-select').addEventListener('click', function () {submitSelectedLocalTargetOpt('div-popup-index', 'dec-targets') ;});
	
	document.getElementById('but-listkeys-back').addEventListener('click', function () {switchPopupDiv('div-popup-settings');});
	document.getElementById('but-addmkey-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	document.getElementById('but-entermkey-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	document.getElementById('but-addkey-back').addEventListener('click', function () {switchPopupDiv('div-popup-settings');});
	document.getElementById('but-settings-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	document.getElementById('but-enc-listkeys-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	document.getElementById('but-enc-targets-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	document.getElementById('but-dec-listkeys-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	document.getElementById('but-dec-targets-back').addEventListener('click', function () {switchPopupDiv('div-popup-index');});
	

}

/**
* if DOM is ready, register our listeners
***/
if (document.readyState == "loading") {
	document.addEventListener('DOMContentLoaded', registerEventListeners);
} else {
	registerEventListeners();
}