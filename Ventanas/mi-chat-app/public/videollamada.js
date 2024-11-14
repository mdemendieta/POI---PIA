document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let peerConnection;
    let localStream;
    const videoElement = document.querySelector('.main-video video');
    const smallVideoElement = document.querySelector('.small-video video');

    document.getElementById("boton-colgar").addEventListener("click", function(event) {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        setTimeout(() => {
            window.location.href = "chats.html";
        }, 100); // Añade un pequeño retardo
    });
    

    async function startVideoCall() {
        try {
            // Solicitar acceso a la cámara y el micrófono
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Mostrar el stream local en el video principal
            videoElement.srcObject = localStream;

            // Iniciar la llamada (envío de stream al otro usuario)
            startCall();
        } catch (error) {
            console.error("Error al acceder a la cámara y micrófono: ", error);
            alert("No se pudo acceder a la cámara y micrófono. Verifica los permisos.");
        }
    }

    // Llamar a la función para iniciar la videollamada cuando la página se carga
    startVideoCall();

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Servidor STUN
    };

    // Crear una nueva conexión de pares
    function createPeerConnection() {
        peerConnection = new RTCPeerConnection(configuration);

        // Agregar el stream local a la conexión
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Manejar los tracks remotos
        peerConnection.ontrack = (event) => {
            console.log("Stream recibido desde la otra parte:", event.streams[0]);
            smallVideoElement.srcObject = event.streams[0];
        };

        // Manejar ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                // Enviar el candidate al otro usuario
                socket.emit('ice-candidate', event.candidate);
            }
        };
    }

    // Llamar a esta función cuando un usuario quiere iniciar una videollamada
    function startCall() {
        createPeerConnection();

        // Crear una oferta
        peerConnection.createOffer()
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                // Enviar la oferta al otro usuario
                socket.emit('video-offer', peerConnection.localDescription);
            })
            .catch(error => {
                console.error("Error creando la oferta: ", error);
            });
    }

    // Lógica para manejar la oferta recibida
    socket.on('video-offer', (offer) => {
        createPeerConnection();
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => {
                // Crear respuesta
                return peerConnection.createAnswer();
            })
            .then(answer => {
                return peerConnection.setLocalDescription(answer);
            })
            .then(() => {
                // Enviar respuesta al otro usuario
                socket.emit('video-answer', peerConnection.localDescription);
            })
            .catch(error => {
                console.error("Error manejando la oferta: ", error);
            });
    });

    // Lógica para manejar la respuesta recibida
    socket.on('video-answer', (answer) => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // Lógica para manejar ICE candidates recibidos
    socket.on('ice-candidate', (candidate) => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Manejadores para botones de respuesta y colgar
    document.querySelector('.answer-btn').addEventListener('click', function() {
        alert('Contestando la llamada...');
    });

    document.querySelector('.hangup-btn').addEventListener('click', function() {
        alert('Colgando la llamada...');
    });
});
