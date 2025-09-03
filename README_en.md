# 🌌 Tunnel

> *Wraps your Discord messages into a cozy Einstein-Rosen bridge.*

A Firefox browser extension that provides end-to-end encryption for Discord messages, ensuring your conversations remain private and secure.

## ✨ Features

- **🔐 End-to-End Encryption**: All messages are protected with AES-256-GCM encryption before sending
- **🔑 Password-Based Security**: PBKDF2 algorithm with 100,000 iterations for robust key generation
- **🎛️ Simple Toggle**: Easy on/off switch in the popup interface
- **🔒 Custom Password**: Set your own encryption password or use the secure default
- **🦊 Firefox Support**: Specifically optimized for Firefox browser
- **⚡ Real-Time**: Seamless encryption/decryption without disrupting your Discord experience

## 🚀 How It Works

1. **Enable the Extension**: Click the Tunnel icon and turn on encryption
2. **Set Your Password**: Use the default secure password or set your own
3. **Chat Normally**: Type messages in Discord as usual
4. **Automatic Encryption**: Messages are automatically encrypted before sending
5. **Automatic Decryption**: Incoming encrypted messages are automatically decrypted and displayed

## 🔧 Installation

### Firefox - from source code
1. Load the extension in developer mode using `manifest.json`
2. Enable the extension and set your encryption password

### Firefox - from extension store
~~1. Visit [`extension`](https://addons.mozilla.org/hu/firefox/search/BarniHekiLinker)~~  
~~2. Add the extension to Firefox and enable it~~


## 🔐 Security Details

- **Encryption Algorithm**: AES-256-GCM
- **Key Generation**: PBKDF2 with SHA-256 and 100,000 iterations
- **Salt and IV**: Randomly generated for each message
- **Message Format**: Encrypted messages are marked with `!?>` prefix

## 📋 Requirements

- Firefox browser
- Access to Discord web application
- Shared encryption password with conversation participants

## ⚠️ Important Notes

- **Password Sharing**: All conversation participants must use the same encryption password
- **Encrypted Format**: Encrypted messages appear as encoded text to users without the extension
- **Local Storage**: Passwords are stored locally in the browser extension storage
- **Discord Compatibility**: Works exclusively with Discord web application

## 👥 Creators

Created by: **Barni** and **HEKI**

## 📄 License

This project is a browser extension for educational and personal use.

---

*Protect your Discord conversations with quantum-inspired encryption technology.* 🛡️      -Barni
