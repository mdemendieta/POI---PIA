// Establecer la conexión con Socket.io
const socket = io();

// Almacena el nombre de usuario
const username = 'Yo'; // Cambia 'Yo' por un nombre de usuario real si es necesario

// Función para manejar el envío de mensajes
function sendMessage() {
    const inputField = document.querySelector('.message-input');
    const message = inputField.value;

    if (message.trim()) {
        // Emitir el mensaje al servidor
        socket.emit('chat message', { username, message });

        // Agregar el mensaje enviado al historial de chat
        const chatHistory = document.querySelector('.chat-history ul');
        chatHistory.innerHTML += `<li class="clearfix">
            <div class="message-data-my text-right">
                <span class="message-data-time">10:20 AM, Hoy</span>
            </div>
            <div class="message other-message float-right">${message}</div>
        </li>`;
        inputField.value = ''; // Limpiar el campo de entrada
    }
}

// Selecciona el contenedor del historial de chat
const chatHistory = document.querySelector('.chat-history');

// Función para hacer scroll al final
function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Escuchar el evento de mensajes
socket.on('chat message', (data) => {
    const chatHistory = document.querySelector('.chat-history ul');
    chatHistory.innerHTML += `<li class="clearfix">
        <div class="message-data">
            <span class="message-data-time">10:21 AM, Hoy</span>
        </div>
        <div class="message my-message">${data.message}</div>
    </li>`;
    // Desplaza el chat automáticamente hacia el final
    scrollToBottom();
});

// Evento de click para enviar el mensaje
document.querySelector('.send-button').addEventListener('click', sendMessage);

// Evento para enviar el mensaje con Enter
document.querySelector('.message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Evento para cerrar sesión
document.getElementById('logout-button').addEventListener('click', () => {
    // Aquí puedes agregar la lógica para cerrar sesión
    alert('Cerrando sesión...');
});



// Manejo de los botones de menú
document.getElementById("videollamada").addEventListener("click", function(event) {
    event.preventDefault();
    window.location.href = "videollamada.html";
});

document.getElementById("rewards-button").addEventListener("click", function(event) {
    event.preventDefault();
    window.location.href = "logros.html";
});

document.getElementById("logout-button").addEventListener("click", function(event) {
    event.preventDefault();
    window.location.href = "inicioyregistro.html";
});

// Función para mostrar/ocultar el menú
function toggleMenu(buttonId, menuId) {
    document.getElementById(buttonId).addEventListener('click', function() {
        const menu = document.getElementById(menuId);
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
}

// Inicializar los menús desplegables
toggleMenu('plus-button', 'plus-menu');
toggleMenu('options-button', 'options-menu');

// Cerrar los menús si se hace clic fuera de ellos
document.addEventListener('click', function(event) {
    const isClickInsidePlus = document.getElementById('plus-button').contains(event.target) || 
                              document.getElementById('plus-menu').contains(event.target);
    const isClickInsideOptions = document.getElementById('options-button').contains(event.target) || 
                                 document.getElementById('options-menu').contains(event.target);

    if (!isClickInsidePlus) {
        document.getElementById('plus-menu').style.display = 'none';
    }

    if (!isClickInsideOptions) {
        document.getElementById('options-menu').style.display = 'none';
    }
});

// Manejador para el botón de adjuntar
document.getElementById("attach-button").addEventListener("click", function(event) {
    event.preventDefault();
    const attachMenu = document.getElementById('attach-menu');
    attachMenu.style.display = attachMenu.style.display === 'block' ? 'none' : 'block';
});