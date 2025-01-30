const socket = io();
let username;
let typingUsers = [];

// Join Chat
function joinChat(event) {
    event.preventDefault();
    username = document.getElementById("username").value.trim();
    if (!username) {
        alert("Adj meg egy nevet!");
        return;
    }
    socket.emit("join", username);
}

// Update user list
socket.on("userlist", (users) => {
    document.getElementById("login").style.display = "none";
    document.getElementById("chat").style.display = "block";
    const userlist = document.getElementById("userlist");
    document.getElementById("usercount").innerText = users.length + " Online";

    // Display avatars of online users
    const onlineUsersContainer = document.getElementById("onlineUsers");
    onlineUsersContainer.innerHTML = '';
    users.forEach(user => {
        const userAvatar = document.createElement('img');
        userAvatar.src = `https://avatars.dicebear.com/api/human/${user}.svg`;
        userAvatar.title = user;
        userAvatar.alt = user;
        userAvatar.classList.add('avatar');
        userAvatar.addEventListener('mouseenter', () => showTooltip(userAvatar, user));
        onlineUsersContainer.appendChild(userAvatar);
    });
});

// Show tooltip
function showTooltip(element, name) {
    const tooltip = document.createElement('div');
    tooltip.innerText = name;
    tooltip.style.position = 'absolute';
    tooltip.style.top = element.offsetTop + 'px';
    tooltip.style.left = element.offsetLeft + 'px';
    tooltip.style.backgroundColor = '#444';
    tooltip.style.padding = '5px';
    tooltip.style.borderRadius = '5px';
    document.body.appendChild(tooltip);
    setTimeout(() => document.body.removeChild(tooltip), 1500);
}

// Display messages
socket.on("message", (data) => {
    console.log(data.text.text);
    const messages = document.getElementById("messages");
    const messageBubble = document.createElement('p');
    const avatar = `<img src="https://avatars.dicebear.com/api/human/${data.name}.svg" class="avatar">`;

    // Displaying the message
    const messageText = data.text.text || ""; // Handle object issue
    if (data.name === username) {
        messageBubble.innerHTML = `<span class="message-bubble sender">${avatar}${messageText}</span>`;
    } else {
        messageBubble.innerHTML = `<span class="message-bubble receiver">${avatar}${messageText}</span>`;
    }
    messages.appendChild(messageBubble);
    messages.scrollTop = messages.scrollHeight;
});

// Show when someone is typing
socket.on("typing", (user) => {
    if (!typingUsers.includes(user)) {
        typingUsers.push(user);
    }
    updateTypingStatus();
});

socket.on("stopTyping", (user) => {
    typingUsers = typingUsers.filter(u => u !== user);
    updateTypingStatus();
});

// Update typing status
function updateTypingStatus() {
    const typingStatus = typingUsers.length > 0
        ? typingUsers.length + " gépel"
        : '';
    document.getElementById("typingStatus").innerText = typingStatus;
}

// Send message when Enter key is pressed
function sendMessage(event) {
    event.preventDefault();
    const message = document.getElementById("message").value.trim();
    if (message) {
        socket.emit("message", { text: message, name: username });
        document.getElementById("message").value = "";
    }
}

// Logout
function logout() {
    socket.emit("logout", username);
    document.getElementById("chat").style.display = "none";
    document.getElementById("login").style.display = "block";
    username = null;
}

// Display Toast
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 3000);
}

// Handle user status change (join/leave)
socket.on("userStatus", (data) => {
    const { user, action } = data;
    const message = action === 'join' 
        ? `${user} csatlakozott a csevegéshez!` 
        : `${user} kilépett a csevegésből!`;
    showToast(message);
});