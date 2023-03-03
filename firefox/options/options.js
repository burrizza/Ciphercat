'use strict';

let myPort;
let sessionMasterKeyTxt;

/**
* Show error underneath current action.
*
* @param 	{String} targetDivId 	- The target of the div to show the feeback in.
* @param 	{String} feedType 		- The type of the feedback (error, warn or info).
* @param 	{String} feedTxt 		- The text of the feedback.
* @return 	{void} 					- Just fire and forget.
***/
function toggleFeedback(targetDivId, feedType, feedTxt) {
	
	let elFeedDiv = document.getElementById('div-form-log-options' + targetDivId);
	let elFeedSpan = document.getElementById('span-form-log-options' + targetDivId);
	
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
* Change the stored masterkey.
*
* @return 	{void} 								- Just fire and forget.
***/
function changeMasterKey() {
	
	toggleFeedback('-changemkey', null);
	
	let elPassCurr = document.getElementById('inp-addmkey-pass-curr');
	let elPassNew = document.getElementById('inp-addmkey-pass-new');
	let elPassNew2 = document.getElementById('inp-addmkey-pass-new2');
	
	
	if (elPassCurr.checkValidity() == false) {
		elPassCurr.reportValidity();
		toggleFeedback('-changemkey', 'error', 'Please enter current password!');
		return;
	} else if (elPassNew.checkValidity() == false) {
		elPassNew.reportValidity();
		toggleFeedback('-changemkey', 'error', 'Please enter a new password!');
		return;
	} else if (elPassNew.value !== elPassNew2.value) {
		elPassNew2.setCustomValidity('The new given password does not match its validation twin.');
		elPassNew2.reportValidity();
		toggleFeedback('-changemkey', 'error', 'The new given password does not match its validation twin!');
		elPassNew2.setCustomValidity('');
		return;
	}
	// set session password to current password
	sessionMasterKeyTxt = elPassCurr.value;
	
	// get encrypted key list from storage
	browser.storage.local.get({'userKeyBundles': null})
		.then((resStorage) => {
			if(resStorage.userKeyBundles == null) {
				toggleFeedback('-changemkey', 'info', 'No stored keybundles found. Updated the key used in current session only!');
				myPort.postMessage({type: 'resyncMasterKey', data: {key: elPassNew.value}});
			} else {
				myPort.postMessage({type: 'changeMasterKey', data: {srcDivId: '-changemkey', masterKey: sessionMasterKeyTxt, newMasterKey: elPassNew.value, userKeyBundles: resStorage.userKeyBundles}});
			}

		})
		.catch((err) => {
			toggleFeedback('-changemkey', 'error', err);
			console.error('[ERROR] (options script): ');
			console.error(err);
		});
}

/**
* Register Event Listeners for UI.
*
* @return 	{void} 								- Just fire and forget.
***/
function registerEventListeners() {
	
	// exchange msgs from and to background.js
	try {	
		myPort = browser.runtime.connect({name: 'port-from-options'});
		myPort.postMessage({type: 'greeting', data: 'ehlo from options script'});
		
		myPort.onMessage.addListener((msg) => {
			if (msg.type === 'greeting') {
				console.log('[INFO] (options script) received greeting from background script: ');
				console.log(msg);
			} else if (msg.type === 'resync') {
				console.log('[INFO] (options script) received resync from background script: ');
				console.log(msg);
			} else if (msg.type === 'error') {
				console.log('[INFO] (options script) received error from background script: ');
				console.log(msg);
				toggleFeedback(msg.data.srcDivId, 'error', msg.data.txt);				
			}  else {
				console.log('[ERROR] (options script) received malformed message from background script: ');
				console.log(msg);
			}
		});

	} catch (err) {
		console.error('[ERROR] (options script): ');
		console.error(err);
	}
	// register elements
	document.getElementById('but-addmkey-add').addEventListener('click', function () {changeMasterKey();});
}

/**
* if DOM is ready, register our listeners
***/
if (document.readyState == "loading") {
	document.addEventListener('DOMContentLoaded', registerEventListeners);
} else {
	registerEventListeners();
}