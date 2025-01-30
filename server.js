const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = {}; // Online felhasználók
let typingUsers = {}; // Gépelő felhasználók
let userStatus = {}; // Felhasználók aktivitása

app.use(express.static("public")); // Statikus fájlok kiszolgálása

// User activity tracking
function updateActivity(userName) {
    userStatus[userName] = Date.now(); // Aktuális idő mentése az aktivitás frissítéséhez
}

// Küldjük a felhasználólistát minden kapcsolatnál
io.on("connection", (socket) => {
    let userName = null;
    console.log("Új kapcsolat!");

    // Felhasználó csatlakozása
    socket.on("join", (name) => {
        if (users[name]) {
            socket.emit("error", "Név foglalt!");
            return;
        }
        userName = name;
        users[userName] = socket.id;
        userStatus[userName] = Date.now(); // Az új felhasználó aktivitásának beállítása

        io.emit("userlist", Object.keys(users)); // Felhasználók listájának küldése mindenki számára
        socket.emit("userStatus", { user: name, action: 'join' }); // Toast üzenet küldése
    });

    // Üzenet küldése
    socket.on("message", (text) => {
        if (userName) {
            io.emit("message", { name: userName, text });
            checkUserStatus(); // Frissítjük a státuszt minden üzenet után
        }
    });

    // Gépelés jelezése
    socket.on("typing", (name) => {
        if (userName) {
            typingUsers[name] = true;
            socket.broadcast.emit("typing", name); // Csak másoknak küldjük, ne annak, aki gépel
        }
    });

    // Gépelés leállítása
    socket.on("stopTyping", (name) => {
        if (userName) {
            delete typingUsers[name];
            socket.broadcast.emit("stopTyping", name); // Csak másoknak küldjük, ne annak, aki abbahagyja a gépelést
        }
    });

    // Felhasználó leválása
    socket.on("disconnect", () => {
        if (userName) {
            delete users[userName];
            delete typingUsers[userName];
            io.emit("userlist", Object.keys(users)); // Felhasználók listájának frissítése
            socket.emit("userStatus", { user: userName, action: 'leave' }); // Toast üzenet küldése
            checkUserStatus(); // Felhasználó aktivitás frissítése
        }
    });

    // Az aktivitás figyelése és frissítése
    setInterval(() => {
        checkUserStatus();
    }, 1000000); // 30 másodpercenként frissítjük az aktivitást
});

// Aktív felhasználók figyelése
function checkUserStatus() {
    const now = Date.now();
    Object.keys(userStatus).forEach((user) => {
        if (now - userStatus[user] > 6000000) { // 60 másodpercnél régebben nem aktív
            io.emit("userStatus", { user, action: 'inactive' }); // Felhasználó inaktív státuszba kerül
        } else {
            io.emit("userStatus", { user, action: 'active' }); // Felhasználó aktív státuszban van
        }
    });
}

server.listen(8080, () => console.log("Szerver fut a 8080 porton"));