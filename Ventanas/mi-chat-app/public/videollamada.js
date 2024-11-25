document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    console.log("Socket connected:", socket);
    console.log("ID de usuario almacenado:", localStorage.getItem("userID"));

    const currentUserId = localStorage.getItem("userID");
    const username = localStorage.getItem("nombreUsuario");
    let receptorId = localStorage.getItem("userIDReceptor");

    if (!currentUserId || !receptorId) {
        console.error("Falta el ID de usuario o el receptor. Verifica el localStorage.");
        return;
    }

    setTimeout(() => {
        socket.emit("user connected", localStorage.getItem("userID"));
    }, 100);

    let peerConnection;
    let localStream;
    let remoteStream = new MediaStream();
    const videoElement = document.querySelector('.main-video video');
    const smallVideoElement = document.querySelector('.small-video video');

    const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    async function startVideoCall() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            smallVideoElement.srcObject = localStream;

            socket.emit('iniciar llamada', {
                emisor: currentUserId,
                receptor: receptorId,
                nombreEmisor: username,
            });

            startCall();
        } catch (error) {
            console.error("Error al acceder a la cámara y micrófono:", error);
            alert("No se pudo acceder a la cámara y micrófono. Verifica los permisos.");
        }
    }

    function createPeerConnection() {
        peerConnection = new RTCPeerConnection(configuration);

        // Agregar todas las pistas locales (video y audio)
        localStream.getTracks().forEach(track => {
            console.log('Adding local track:', track);
            peerConnection.addTrack(track, localStream);
        });

        // Configurar recepción de pistas remotas
        // peerConnection.ontrack = (event) => {
        //     console.log('Remote track received:', event.streams[0]);
        //     event.streams[0].getTracks().forEach(track => {
        //         console.log('Adding remote track:', track);
        //         remoteStream.addTrack(track);
        //     });
        //     videoElement.srcObject = remoteStream;
        // };

        peerConnection.ontrack = (event) => {
            console.log('Remote track received:', event.streams[0]);
            event.streams[0].getTracks().forEach(track => {
                console.log('Adding remote track:', track);
                if (track.kind === 'audio') {
                    console.log('Audio track info:', track.getSettings());
                }
                remoteStream.addTrack(track);
            });
            videoElement.srcObject = remoteStream;
        
            // Asignar la pista de audio al elemento de vídeo
            const audioTracks = remoteStream.getAudioTracks();
            if (audioTracks.length > 0) {
                const audioElement = new Audio();
                audioElement.srcObject = new MediaStream(audioTracks);
                audioElement.play();
            }
        };
        

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', { candidate: event.candidate, receptor: receptorId });
            }
        };
    }

    function startCall() {
        createPeerConnection();
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                socket.emit('video-offer', {
                    offer: peerConnection.localDescription,
                    receptor: receptorId,
                    emisor: currentUserId
                });
            })
            .catch(error => console.error("Error creando la oferta:", error));
    }

    socket.on('video-offer', (data) => {
        receptorId = data.emisor;
        createPeerConnection();
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => peerConnection.createAnswer())
            .then(answer => peerConnection.setLocalDescription(answer))
            .then(() => {
                socket.emit('video-answer', { answer: peerConnection.localDescription, receptor: data.emisor });
            })
            .catch(error => console.error("Error al procesar video-offer:", error));
    });

    socket.on('video-answer', (data) => {
        if (data.answer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
                .catch(error => console.error("Error al establecer RemoteDescription:", error));
        }
    });

    socket.on('ice-candidate', (data) => {
        if (data.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                .catch(error => console.error("Error agregando ICE candidate:", error));
        }
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
            localStream.getTracks().forEach(track => stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        window.location.href = "chats.html";
    });

    startVideoCall();
});
