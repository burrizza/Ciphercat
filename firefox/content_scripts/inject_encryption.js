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
 
(function() {
	/**
	* marker if this script already had been injected into the tab
	* Partly based on https://github.com/mdn/webextensions-examples/tree/main/beastify
	***/
	if (window.injected_encryption) {
		return;
	}
	window.injected_encryption = true;

	let nodesRelevant = [];
		
	/**
	* Quick lazy check if we have a wordpress editor doc
	***/
	function isEditableWordPressDocument() {
		// id "wpbody" for edit
		if ((document.getElementById('wpbody') == null) && (document.getElementById('editor') == null) && (document.getElementsByName('editor-canvas').length === 0)) {
			return false;
		} else {
			return true;
		}
	}
	
	/**
	* Quick lazy check if we have a wordpress doc
	***/
	function isReadableWordPressDocument() {
		// class "wp-site-blocks" for read
		if ((document.getElementById('wp--skip-link--target') == null) && !(isEditableWordPressDocument())) {
			return false;
		} else {
			return true;
		}
	}

	/**
	* Replace text in document with its encrypted pendant
	* TODO: Maybe merge with wordPressDecryption
	***/
	function wordPressEncryption(encryptedObjectsTxt) {
		
		
		if (isEditableWordPressDocument()) {
			
			// get editor div
			let editor = document.getElementById('editor');
			if (editor == null) {
				let iframe_editor = document.getElementsByName('editor-canvas')[0];
				editor = iframe_editor.contentDocument;
			}
			// fetch editables
			let nodesEditable = editor.querySelectorAll('[contenteditable="true"]');
			
			// iterate through encrypted objects
			for (let i = 0; i < encryptedObjectsTxt.length; i++) {
				
				nodeId = encryptedObjectsTxt[i].id;	
				nodesEditable[nodeId].textContent = encryptedObjectsTxt[i].txt_encrypted;
				// trigger wordpress edited mode focus() won't work anymore?
				let eve = new Event('input', {bubbles: true});		
				nodesEditable[nodeId].dispatchEvent(eve);			
			}
		} else {
			let main = document.getElementById('wp--skip-link--target');
			let nodesSelection = main.querySelectorAll('H1,H2,H3,H4,H5,H6,P,TD,SPAN,A');
			
			// iterate through encrypted objects
			for (let i = 0; i < decryptedObjectsTxt.length; i++) {
				
				nodeId = decryptedObjectsTxt[i].id;
				nodesSelection[nodeId].textContent = encryptedObjectsTxt[i].txt_decrypted;
			}
		}
	}

	/**
	* Replace text in document with its decrypted pendant
 	* TODO: Maybe merge with wordPressEncryption
	***/	
	function wordPressDecryption(decryptedObjectsTxt) {
		
		if (isEditableWordPressDocument()) {
			// get editor div
			let editor = document.getElementById('editor');
			if (editor == null) {
				let iframe_editor = document.getElementsByName('editor-canvas')[0];
				editor = iframe_editor.contentDocument;
			}
			
			// fetch editables
			let nodesEditable = editor.querySelectorAll('[contenteditable="true"]');
			
			// iterate through encrypted objects
			for (let i = 0; i < decryptedObjectsTxt.length; i++) {
				
				nodeId = decryptedObjectsTxt[i].id;
				nodesEditable[nodeId].textContent = decryptedObjectsTxt[i].txt_decrypted;
				// trigger wordpress edited mode
				nodesEditable[nodeId].focus();
			}		
		} else {
			let main = document.getElementById('wp--skip-link--target');
			let nodesSelection = main.querySelectorAll('H1,H2,H3,H4,H5,H6,P,TD,SPAN,A');
			
			// iterate through encrypted objects
			for (let i = 0; i < decryptedObjectsTxt.length; i++) {
				
				nodeId = decryptedObjectsTxt[i].id;
				nodesSelection[nodeId].textContent = decryptedObjectsTxt[i].txt_decrypted;
			}	
		}	
	}
	
	/**
	* Catch all viewable nodes from document
	***/
	function wordPressDecGenObjectsTxt() {
		
		let txtObjRelevant = [];
		
		if (isEditableWordPressDocument()) {
			// get editor div
			let editor = document.getElementById('editor');
			if (editor == null) {
				let iframe_editor = document.getElementsByName('editor-canvas')[0];
				editor = iframe_editor.contentDocument;
			}
			
			// fetch editables
			let nodesEditable = editor.querySelectorAll('[contenteditable="true"]');
			
			for (let i = 0; i < nodesEditable.length; i++) {
				let txt = nodesEditable[i].textContent.trim();
				if ((txt == null) || (txt === '') || ((txt.substring(0, 27) !== '-----BEGIN PGP MESSAGE-----') && (txt.substring(0, 21) !== '—–BEGIN PGP MESSAGE—–'))) {
					continue;
				}
				if (txt.substring(0, 27) === '-----BEGIN PGP MESSAGE-----') {
					txt = txt.substring(27, txt.length - 25);
					txt = txt.replaceAll(' ', '\n');
					txt = '-----BEGIN PGP MESSAGE-----\n' + txt + '-----END PGP MESSAGE-----\n';
					
				} else if (txt.substring(0, 21) === '—–BEGIN PGP MESSAGE—–') {
					txt = txt.substring(21, txt.length - 19);
					txt = txt.replaceAll(' ', '\n');
					txt = '-----BEGIN PGP MESSAGE-----\n' + txt + '-----END PGP MESSAGE-----\n';
				}			
				// temporary store copy of found node
				nodesRelevant.push(nodesEditable[i]);
				// create primitive object for messaging
				nodeTxtObj = {'id': i, 'txt': txt, 'txt_decrypted': null};
				txtObjRelevant.push(nodeTxtObj);
			}			
		} else {
			let main = document.getElementById('wp--skip-link--target');
			let nodesSelection = main.querySelectorAll('H1,H2,H3,H4,H5,H6,P,TD,SPAN,A');
			
			for (let i = 0; i < nodesSelection.length; i++) {
				let txt = nodesSelection[i].textContent.trim();
				if ((txt == null) || (txt === '') || ((txt.substring(0, 27) !== '-----BEGIN PGP MESSAGE-----') && (txt.substring(0, 21) !== '—–BEGIN PGP MESSAGE—–'))) {
					continue;
				}
				
				if (txt.substring(0, 27) === '-----BEGIN PGP MESSAGE-----') {
					txt = txt.substring(27, txt.length - 25);
					txt = txt.replaceAll(' ', '\n');
					txt = '-----BEGIN PGP MESSAGE-----\n' + txt + '-----END PGP MESSAGE-----\n';
					
				} else if (txt.substring(0, 21) === '—–BEGIN PGP MESSAGE—–') {
					txt = txt.substring(21, txt.length - 19);
					txt = txt.replaceAll(' ', '\n');
					txt = '-----BEGIN PGP MESSAGE-----\n' + txt + '-----END PGP MESSAGE-----\n';
				}
				// temporary store copy of found node
				nodesRelevant.push(nodesSelection[i]);
				// create primitive object for messaging
				nodeTxtObj = {'id': i, 'txt': txt, 'txt_decrypted': null};
				txtObjRelevant.push(nodeTxtObj);
			}	
			
		}
		return txtObjRelevant;
	}
		
	/**
	* Catch all editable nodes from document (entrypoint is wp editor)
	***/
	function wordPressEncGenObjectsTxt() {
		

		// get editor div
		let editor = document.getElementById('editor');
		if (editor == null) {
			let iframe_editor = document.getElementsByName('editor-canvas')[0];
			editor = iframe_editor.contentDocument;
		}
		// fetch editables
		let nodesEditable = editor.querySelectorAll('[contenteditable="true"]');
		//let nodesSelection = editor.querySelectorAll('H1,H2,H3,H4,H5,H6,P,TD,SPAN,A,DIV');
		let txtObjRelevant = [];
				
		for (let i = 0; i < nodesEditable.length; i++) {
			let txt = nodesEditable[i].textContent;
			if ((txt == null) || (txt.trim() == '')) {
				continue;
			}
			// temporary store copy of found node
			nodesRelevant.push(nodesEditable[i]);
			// create primitive object for messaging
			nodeTxtObj = {'id': i, 'txt': txt, 'txt_encrypted': null};
			txtObjRelevant.push(nodeTxtObj);
		}
		
		return txtObjRelevant;
	}
		
	browser.runtime.onMessage.addListener((msg, sender) => {

			if (msg.type === 'greeting') {
				console.log("[INFO] (content script) received message from background script: ");
				console.log(msg);
				return Promise.resolve({type: 'greeting', data: 'ehlo from content script'});
			} else if (msg.type === 'encryptTarget') {
				console.log("[INFO] (content script) received encryptTarget message from background script: ");
				console.log(msg);
				if (msg.data.name == 'wordpress') {						
					if (!isEditableWordPressDocument()) {
						return Promise.resolve({type: 'error', data: 'Sorry, could not detect a editable wordpress document in active tab.'});
					}
					console.log("[INFO] (content script) editable wordpress document detected.");
					let relevantObjectsTxt = wordPressEncGenObjectsTxt();
					return Promise.resolve({type: 'encryptObjectsTxt', data: relevantObjectsTxt});
				}
			} else if (msg.type === 'decryptTarget') {
				console.log("[INFO] (content script) received decryptTarget message from background script: ");
				console.log(msg);
				if (msg.data.name == 'wordpress') {	
					if (!isReadableWordPressDocument()) {
						return Promise.resolve({type: 'error', data: 'Sorry, could not detect a wordpress document in active tab.'});
					}
					console.log("[INFO] (content script) wordpress document detected.");					
					let relevantObjectsTxt = wordPressDecGenObjectsTxt();
					return Promise.resolve({type: 'decryptObjectsTxt', data: relevantObjectsTxt});
				}
			} else if (msg.type === 'encryptedObjectsTxt') {
				console.log("[INFO] (content script) received encryptedObjectsTxt message from background script: ");
				console.log(msg);
				wordPressEncryption(msg.data);
			} else if (msg.type === 'decryptedObjectsTxt') {
				console.log("[INFO] (content script) received decryptedObjectsTxt message from background script: ");
				console.log(msg);
				wordPressDecryption(msg.data);
			} else {
				console.log("[ERROR] (content script) received malformed message from background script: ");
				console.log(msg);
			}
		});
})();