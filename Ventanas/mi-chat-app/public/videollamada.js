document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    console.log("Socket connected:", socket);
    console.log("ID de usuario almacenado:", localStorage.getItem("userID"));
    const currentUserId = localStorage.getItem("userID");
    const username = localStorage.getItem("nombreUsuario"); 
    console.log("ID actual antes de emitir:", currentUserId);
if (!currentUserId) {
    console.error("El ID de usuario no está definido. Verifica su asignación en el localStorage.");
    return;
}
setTimeout(() => {
    socket.emit("user connected", localStorage.getItem("userID"));
}, 100);

    let peerConnection;
    let localStream;
    let remoteStream = new MediaStream();
    let receptorId;
    const videoElement = document.querySelector('.main-video video');
    const smallVideoElement = document.querySelector('.small-video video');

    receptorId = localStorage.getItem("userIDReceptor");
    console.log("el receptor es:", receptorId);
    

    // Función para iniciar la videollamada
    async function startVideoCall() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log("Local stream obtained");
            console.log("Local stream tracks: ", localStream.getTracks());
            smallVideoElement.srcObject = localStream;
            
            // Emitir el evento para iniciar la llamada
            socket.emit('iniciar llamada', { 
                emisor: currentUserId, 
                receptor: receptorId, 
                nombreEmisor: username, // Replace with the actual user's name if needed
            });
    
            startCall();
        } catch (error) {
            console.error("Error al acceder a la cámara y micrófono: ", error);
            alert("No se pudo acceder a la cámara y micrófono. Verifica los permisos.");
        }
    }
    

    startVideoCall();

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    function createPeerConnection() {
        peerConnection = new RTCPeerConnection(configuration);

        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
            console.log("Added local track: ", track);
        });

        peerConnection.ontrack = (event) => {
            console.log("Received remote track: ", event.track);
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
                console.log("Added track to remoteStream: ", track);
            });
            console.log("Remote stream tracks: ", remoteStream.getTracks());
            videoElement.srcObject = remoteStream;
        };
        

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate: ", event.candidate);
                socket.emit('ice-candidate', { candidate: event.candidate, receptor: receptorId });
            }
        };
    }

    function startCall() {
        createPeerConnection();
        peerConnection.createOffer()
            .then(offer => {
                console.log("Created offer: ", offer);
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log("Receptor ID al iniciar llamada:", receptorId);
                console.log("Local description set: ", peerConnection.localDescription);
                socket.emit('video-offer', { offer: peerConnection.localDescription, receptor: receptorId, emisor: currentUserId });
                console.log("Sent video offer");
            })
            .catch(error => console.error("Error creando la oferta: ", error));
    }

    socket.on('video-offer', (data) => {
        receptorId = data.emisor;
        createPeerConnection();
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => {
                return peerConnection.createAnswer();
            })
            .then(answer => {
                socket.emit('video-answer', { answer: peerConnection.localDescription, receptor: data.emisor });
            });
    });

    socket.on('video-answer', (data) => {
        console.log("Received video answer: ", data);
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
            .catch(error => console.error("Error al establecer RemoteDescription: ", error));
    });

    socket.on('ice-candidate', (data) => {
        console.log("Received ICE candidate: ", data.candidate);
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch(error => console.error("Error agregando ICE candidate: ", error));
    });

    document.getElementById("boton-colgar").addEventListener("click", () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        socket.emit('hangUp', { userId: currentUserId });
        setTimeout(() => {
            window.location.href = "chats.html";
        }, 100);
    });

    socket.on('hangUp', () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        window.location.href = "chats.html";
    });
});
