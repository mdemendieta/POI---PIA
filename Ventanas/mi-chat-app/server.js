const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'PIA_POI'
});

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos');
});



// Escuchar el evento de mensajes
        socket.on('nuevo mensaje', function(data) {
            const { id_Usuario_Emisor, id_Usuario_Receptor, Contenido, hora } = data;
        
            // Asegurarse de que el mensaje se agregue correctamente para el receptor correcto
            if (id_Usuario_Receptor === currentContactId) {
                const chatHistory = document.querySelector('.chat-history ul');
            
                chatHistory.innerHTML += 
                    <li class="clearfix">
                        <div class="message-data-my text-right">
                            <span class="message-data-time">${hora}</span>
                        </div>
                        <div class="message other-message float-right">${Contenido}</div>
                    </li>;
                scrollToBottom();
            }   else {
                // Cargar la conversación si el mensaje es para un contacto diferente
                cargarConversacion(currentContactId, $('#contact-name').text(), $('#contact-avatar').attr('src'), $('#contact-status').text(), localStorage.getItem('userID'));
            }
        });