# 🌌 Tunnel

> *Becsomagolja a Discord üzeneteidet egy barátságos Einstein-Rosen hídba.*

Egy Firefox böngésző kiegészítő, amely végpontok közötti titkosítást biztosít a Discord üzenetekhez, garantálva hogy a beszélgetéseid privátak és biztonságosak maradjanak.

## ✨ Funkciók

- **🔐 Végpontok Közötti Titkosítás**: Minden üzenet AES-256-GCM titkosítással van védve küldés előtt
- **🔑 Jelszó Alapú Biztonság**: PBKDF2 algoritmus 100,000 iterációval a robusztus kulcs generáláshoz
- **🎛️ Egyszerű Kapcsoló**: Könnyű be/ki kapcsoló a popup felületen
- **🔒 Egyedi Jelszó**: Állíts be saját titkosító jelszót vagy használd a biztonságos alapértelmezettet
- **🦊 Firefox Támogatás**: Kifejezetten Firefox böngészőre optimalizálva
- **⚡ Valós Idejű**: Zökkenőmentes titkosítás/visszafejtés anélkül, hogy megzavarná a Discord élményedet

## 🚀 Hogyan Működik

1. **Engedélyezd a Kiegészítőt**: Kattints a Tunnel ikonra és kapcsold be a titkosítást
2. **Állítsd Be a Jelszavadat**: Használd az alapértelmezett biztonságos jelszót vagy állíts be sajátot
3. **Beszélgess Normálisan**: Írj üzeneteket a Discordban mint mindig
4. **Automatikus Titkosítás**: Az üzenetek automatikusan titkosítva lesznek küldés előtt
5. **Automatikus Visszafejtés**: A beérkező titkosított üzenetek automatikusan visszafejtve és megjelenítve lesznek

## 🔧 Telepítés

### Firefox - teljes kódból
1. Töltsd be a kiegészítőt fejlesztői módban a `manifest.json` használatával
2. Engedélyezd a kiegészítőt és állítsd be a titkosító jelszavadat


### Firefox - extensionből
~~1. Menj a [`kiegészítő`](https://addons.mozilla.org/hu/firefox/search/BarniHekiLinker) oldalra.~~

~~**2. Hozzáadás és Engedélyezés**~~


## 🔐 Biztonsági Részletek

- **Titkosítási Algoritmus**: AES-256-GCM
- **Kulcs Generálás**: PBKDF2 SHA-256-tal és 100,000 iterációval
- **Salt és IV**: Véletlenszerűen generált minden üzenethez
- **Üzenet Formátum**: A titkosított üzenetek `!?>` előtaggal vannak megjelölve

## 📋 Követelmények

- Firefox böngésző
- Hozzáférés a Discord webalkalmazáshoz
- Közös titkosító jelszó a beszélgetés résztvevőivel

## ⚠️ Fontos Megjegyzések

- **Jelszó Megosztás**: A beszélgetés minden résztvevőjének ugyanazt a titkosító jelszót kell használnia
- **Titkosított Formátum**: A titkosított üzenetek kódolt szövegként jelennek meg a kiegészítő nélküli felhasználóknak
- **Helyi Tárolás**: A jelszavak helyileg vannak tárolva a böngésző kiegészítő tárolójában
- **Discord Kompatibilitás**: Kizárólag a Discord webalkalmazással működik

## 👥 Készítők

Készítette: **Barni** és **HEKI**

## 📄 Licenc

Ez a projekt egy böngésző kiegészítő oktatási és személyes használatra.

---

*Védd meg a Discord beszélgetéseidet kvantum-inspirált titkosítási technológiával.* 🛡️      -Barni
