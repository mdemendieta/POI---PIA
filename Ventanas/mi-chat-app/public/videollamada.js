document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    console.log("Socket connected:", socket);
    console.log("ID de usuario almacenado:", localStorage.getItem("userID"));

    const currentUserId = localStorage.getItem("userID");
    const username = localStorage.getItem("nombreUsuario");
    let receptorId = localStorage.getItem("userIDReceptor");

    console.log("ID actual antes de emitir:", currentUserId);
    console.log("El receptor es:", receptorId);

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
            console.log("Local stream obtained");
            console.log("Local stream tracks:", localStream.getTracks());
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
            peerConnection.addTrack(track, localStream);
            console.log("Added local track:", track);
        });

        // peerConnection.ontrack = (event) => {
        //     console.log("Received remote track:", event.track);
        //     event.streams[0].getTracks().forEach(track => {
        //         remoteStream.addTrack(track);
        //         console.log("Added track to remoteStream:", track);

        //         // Detectar si es una pista de audio
        //         if (track.kind === "audio") {
        //             console.log("Hola"); // Aquí imprimimos "hola" cuando se recibe audio
        //         }
        //     });
        //     videoElement.srcObject = remoteStream;
        // };

        peerConnection.ontrack = (event) => {
            console.log("Received remote track:", event.track);
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
                console.log("Added track to remoteStream:", track);
        
                // Detectar si es una pista de audio
                if (track.kind === "audio") {
                    console.log("Pista de audio detectada");
                    
                    // Escuchar cambios en el nivel de volumen para confirmar recepción de audio
                    const audioContext = new AudioContext();
                    const audioSource = audioContext.createMediaStreamSource(remoteStream);
                    const analyser = audioContext.createAnalyser();
        
                    audioSource.connect(analyser);
        
                    // Monitor de audio (verifica si hay actividad en la pista de audio)
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    const checkAudio = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const sum = dataArray.reduce((a, b) => a + b, 0);
                        if (sum > 0) {
                            console.log("Recibiendo audio del otro usuario: Hola");
                        } else {
                            console.log("Sin actividad de audio por ahora");
                        }
                        // Continuar verificando periódicamente
                        setTimeout(checkAudio, 1000);
                    };
        
                    checkAudio();
                }
            });
            videoElement.srcObject = remoteStream;
        };
        

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("Sending ICE candidate:", event.candidate);
                socket.emit('ice-candidate', { candidate: event.candidate, receptor: receptorId });
            }
        };
    }

    function startCall() {
        createPeerConnection();
        peerConnection.createOffer()
            .then(offer => {
                console.log("Created offer:", offer);
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log("Local description set:", peerConnection.localDescription);
                socket.emit('video-offer', { offer: peerConnection.localDescription, receptor: receptorId, emisor: currentUserId });
                console.log("Sent video offer");
            })
            .catch(error => console.error("Error creando la oferta:", error));
    }

    socket.on('video-offer', (data) => {
        receptorId = data.emisor;
        createPeerConnection();
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => peerConnection.createAnswer())
            .then(answer => {
                return peerConnection.setLocalDescription(answer);
            })
            .then(() => {
                console.log("Sending video answer:", peerConnection.localDescription);
                socket.emit('video-answer', { answer: peerConnection.localDescription, receptor: data.emisor });
            })
            .catch(error => console.error("Error al procesar video-offer:", error));
    });

    socket.on('video-answer', (data) => {
        console.log("Received video answer:", data);
        if (data.answer && data.answer.type && data.answer.sdp) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
                .catch(error => console.error("Error al establecer RemoteDescription:", error));
        } else {
            console.error("Invalid answer data received:", data);
        }
    });

    socket.on('ice-candidate', (data) => {
        if (data.candidate) {
            console.log("Received ICE candidate:", data.candidate);
            peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                .catch(error => console.error("Error agregando ICE candidate:", error));
        } else {
            console.warn("ICE candidate nulo o inválido recibido:", data);
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
            localStream.getTracks().forEach(track => track.stop());
        }
        if (peerConnection) {
            peerConnection.close();
        }
        window.location.href = "chats.html";
    });

    startVideoCall();
});
