const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mysql = require('mysql');
require('dotenv').config(); // Cargar variables de entorno

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

const multer = require('multer');
app.use('/fotosGrupos', express.static('fotosGrupos'));

// Configuración de multer para guardar archivos con la extensión
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'fotosGrupos/'); // Directorio donde se guardarán las fotos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + path.extname(file.originalname); // Generar un nombre único con la extensión
        cb(null, uniqueSuffix); // Guardar el archivo con su extensión
    }
});

const upload = multer({ storage: storage });

// Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD, // Utiliza variable de entorno
    database: 'PIA_POI'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
        return;
    }
    console.log('Conectado a la base de datos');
});

// Middleware para analizar cuerpos de solicitudes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir el archivo 'chats.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'inicioyregistro.html'));
});

// Ruta para servir el archivo 'videollamada.html'
app.get('/videollamada', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'videollamada.html'));
});

// Endpoint para autenticar usuario
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Busca el usuario en la base de datos
    const query = 'SELECT id_Usuario, Nombre_Usuario, Foto FROM Usuario WHERE Nombre_Usuario = ? AND Contraseña = ?';
    connection.query(query, [username, password], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length > 0) {
            const { id_Usuario, Nombre_Usuario, Foto } = results[0];
            res.json({ userID: id_Usuario, nombreUsuario: Nombre_Usuario, fotoUsuario: Foto });
        } else {
            res.status(401).send('Credenciales incorrectas');
        }
    });
});


// Endpoint para obtener contactos
app.get('/api/contactos/:userID', (req, res) => {
    const userId = req.params.userID; // Obten el userID desde el cliente
    console.log("ID de usuario recibido:", userId);

    if (!userId) {
        return res.status(400).send('ID de usuario no proporcionado');
    }

    const query = `
        SELECT u.id_Usuario, u.Nombre, u.Apellido, u.Nombre_Usuario, u.Foto, u.Estado
        FROM Contacto c 
        JOIN Usuario u ON c.id_Contacto_Usuario = u.id_Usuario 
        WHERE c.id_Usuario = ?;
    `;
    
    connection.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).send('Error en la consulta a la base de datos');
        }
        res.json(results);
    });
});

// Endpoint para obtener contactos y grupos del usuario
app.get('/api/contactos-y-grupos/:userID', (req, res) => {
    const userId = req.params.userID;

    if (!userId) {
        return res.status(400).send('ID de usuario no proporcionado');
    }

    const queryContactos = `
        SELECT u.id_Usuario, u.Nombre, u.Apellido, u.Foto, u.Estado
        FROM Contacto c 
        JOIN Usuario u ON c.id_Contacto_Usuario = u.id_Usuario 
        WHERE c.id_Usuario = ?;
    `;

    const queryGrupos = `
        SELECT g.id_Grupo AS id_Grupo, g.Nombre AS nombre, g.Foto AS foto
        FROM Usuario_Grupo gu
        JOIN Grupo g ON gu.id_Grupo = g.id_Grupo
        WHERE gu.id_Usuario = ?;
    `;

    connection.query(queryContactos, [userId], (err, contactos) => {
        if (err) {
            return res.status(500).send('Error en la consulta a la base de datos');
        }

        connection.query(queryGrupos, [userId], (err, grupos) => {
            if (err) {
                return res.status(500).send('Error en la consulta a la base de datos');
            }

            res.json({ contactos, grupos });
        });
    });
});


// Ruta para obtener la conversación con un contacto específico o un grupo
app.get('/api/conversacion/:contactId', (req, res) => {
    const contactId = req.params.contactId;
    const userId = req.query.userID;
    const isGroup = req.query.esGrupo === 'true'; // Detectar si es una conversación de grupo

    if (!userId || isNaN(contactId) || isNaN(userId)) {
        return res.status(400).send('ID de usuario o contacto inválido');
    }

    let query;
    let queryParams;

    if (isGroup) {
        // Consulta para obtener mensajes del grupo específico
        query = `
            SELECT m.id_Usuario_Emisor, m.Contenido AS texto,
                   DATE_FORMAT(m.Fecha_Hora, '%d-%m-%Y') AS fecha,
                   DATE_FORMAT(m.Fecha_Hora, '%h:%i %p') AS hora,
                   u.Nombre AS nombreEmisor, u.Foto AS fotoEmisor
            FROM Mensaje m
            JOIN Usuario u ON m.id_Usuario_Emisor = u.id_Usuario
            WHERE m.id_Grupo = ?
            ORDER BY m.Fecha_Hora ASC;
        `;
        queryParams = [contactId];
    } else {
        // Consulta para obtener mensajes individuales entre dos usuarios
        query = `
            SELECT m.id_Usuario_Emisor, m.Contenido AS texto,
                   DATE_FORMAT(m.Fecha_Hora, '%d-%m-%Y') AS fecha,
                   DATE_FORMAT(m.Fecha_Hora, '%h:%i %p') AS hora
            FROM Mensaje m
            WHERE (m.id_Usuario_Emisor = ? AND m.id_Usuario_Receptor = ?)
               OR (m.id_Usuario_Emisor = ? AND m.id_Usuario_Receptor = ?)
            ORDER BY m.Fecha_Hora ASC;
        `;
        queryParams = [userId, contactId, contactId, userId];
    }

    connection.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error en la consulta a la base de datos:', err);
            return res.status(500).send('Error en la consulta a la base de datos');
        }

        results = results.map(msg => {
            msg.hora = msg.hora.toLowerCase().replace('am', 'a.m.').replace('pm', 'p.m.');
            return msg;
        });

        res.json(results);
    });
});



// Endpoint para enviar un mensaje
app.post('/api/mensajes', (req, res) => {
    const { id_Usuario_Emisor, id_Usuario_Receptor, Contenido, id_Grupo } = req.body;

    if (!id_Usuario_Emisor || !Contenido) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const query = id_Grupo
        ? `INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora, id_Grupo) VALUES (?, NULL, ?, NOW(), ?)`
        : `INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora) VALUES (?, ?, ?, NOW())`;

    const params = id_Grupo ? [id_Usuario_Emisor, Contenido, id_Grupo] : [id_Usuario_Emisor, id_Usuario_Receptor, Contenido];

    connection.query(query, params, (err, result) => {
        if (err) {
            console.error("Error al guardar el mensaje en la base de datos:", err);
            return res.status(500).json({ error: "Error al guardar el mensaje en la base de datos" });
        }

        const mensaje = {
            id_Usuario_Emisor,
            id_Usuario_Receptor: id_Usuario_Receptor || null,
            Contenido,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
            id_Grupo
        };

        if (id_Grupo) {
            io.emit('nuevo mensaje', mensaje);
        } else {
            const receptorSocketId = usuariosConectados[id_Usuario_Receptor];
            if (receptorSocketId) {
                io.to(receptorSocketId).emit('nuevo mensaje', mensaje);
            }
        }

        res.status(201).json({ message: "Mensaje enviado exitosamente" });
    });
});




app.post('/api/grupos', upload.single('foto'), (req, res) => {
    const { nombre, miembros, creadorId } = req.body; // Obtener los datos del cuerpo de la solicitud
    const fotoGrupo = req.file ? req.file.filename : null; // Obtener el nombre del archivo subido

    if (!nombre || !miembros || miembros.length === 0 || !creadorId) {
        return res.status(400).json({ error: 'Nombre de grupo, miembros y creador son obligatorios' });
    }

    const queryGrupo = 'INSERT INTO Grupo (Nombre, Foto) VALUES (?, ?)';

    // Asegúrate de que `fotoGrupo` no sea nulo
    connection.query(queryGrupo, [nombre, fotoGrupo], (err, result) => {
        if (err) {
            console.error('Error al crear el grupo:', err);
            return res.status(500).json({ error: 'Error al crear el grupo' });
        }

        const idGrupo = result.insertId; // Obtener el ID del grupo creado

        const valoresMiembros = [...JSON.parse(miembros), creadorId].map(idUsuario => [idGrupo, idUsuario]);
        const queryMiembros = 'INSERT INTO Usuario_Grupo (id_Grupo, id_Usuario) VALUES ?';

        connection.query(queryMiembros, [valoresMiembros], (err) => {
            if (err) {
                console.error('Error al agregar miembros al grupo:', err);
                return res.status(500).json({ error: 'Error al agregar miembros al grupo' });
            }

            res.status(201).json({ message: 'Grupo creado exitosamente' });

            io.emit('nuevoGrupo', {
                id_Grupo: idGrupo,
                nombre: nombre,
                descripcion: "Grupo",
                foto: fotoGrupo,
                miembros: miembros
            });
        });
    });
});





// Almacenar los usuarios conectados
const usuariosConectados = {}; // Inicializa el objeto para almacenar conexiones

// WebSocket: Escuchar nuevas conexiones
io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado');
    // Almacenar el socket id con el user ID cuando el usuario se conecta
    socket.on('user connected', (userId) => {
        usuariosConectados[userId] = socket.id;
        console.log(`Usuario ${userId} conectado con socket ID: ${socket.id}`);
        io.emit('actualizarEstadoContacto', { userId, estado: 'En línea' });

        // Actualizar el estado del usuario en la base de datos a "En línea"
        const query = 'UPDATE Usuario SET Estado = "En línea" WHERE id_Usuario = ?';
        connection.query(query, [userId], (err) => {
            if (err) {
                console.error('Error al actualizar el estado del usuario:', err);
            } else {
                console.log(`Estado de usuario ${userId} actualizado a En línea`);
            }
        });
    });

    socket.on('chat message', (msg) => {
        console.log('Mensaje recibido: ', msg);
        io.emit('chat message', msg);
    });

    socket.on('nuevo mensaje', (data) => {
        console.log('Nuevo mensaje:', data);
        io.emit('nuevo mensaje', data);
    });

    // Manejar evento de iniciar llamada
    socket.on('iniciar llamada', (data) => {
        const { emisor, receptor, nombreEmisor } = data;
        const receptorSocketId = usuariosConectados[receptor]; // Obtener el socket del receptor
        
        if (receptorSocketId) {
            // Enviar la solicitud de llamada al receptor
            io.to(receptorSocketId).emit('solicitud llamada', { emisor, nombreEmisor });
            console.log(`Solicitud de llamada enviada de ${emisor} a ${receptor}`);
        } else {
            console.log(`El usuario con ID ${receptor} no está conectado`);
        }
    });

    // Manejar evento de respuesta a la llamada
    socket.on('respuesta llamada', (data) => {
        const { aceptada, emisor } = data;
        const emisorSocketId = usuariosConectados[emisor];
        
        if (aceptada) {
            io.to(emisorSocketId).emit('llamada aceptada');
        } else {
            io.to(emisorSocketId).emit('llamada rechazada');
        }
    });

    // Eliminar al usuario de usuariosConectados al desconectarse
    socket.on('disconnect', () => {
        const userId = Object.keys(usuariosConectados).find(id => usuariosConectados[id] === socket.id);
        io.emit('actualizarEstadoContacto', { userId, estado: 'Desconectado' });

        if (userId) {
            // Actualizar el estado del usuario en la base de datos a "Desconectado"
            const query = 'UPDATE Usuario SET Estado = "Desconectado" WHERE id_Usuario = ?';
            connection.query(query, [userId], (err) => {
                if (err) {
                    console.error('Error al actualizar el estado del usuario:', err);
                } else {
                    console.log(`Estado de usuario ${userId} actualizado a Desconectado`);
                }
            });

            // Remover al usuario de la lista de usuarios conectados
            delete usuariosConectados[userId];
            console.log(`Usuario ${userId} desconectado y eliminado de la lista de usuarios conectados`);
        }
    });
});

// Puerto configurable usando variable de entorno o por defecto 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
