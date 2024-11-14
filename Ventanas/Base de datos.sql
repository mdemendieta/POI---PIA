CREATE DATABASE PIA_POI;

USE PIA_POI;

CREATE TABLE Usuario (
    id_Usuario INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Apellido VARCHAR(255) NOT NULL,
    Fecha_Nacimiento DATE NOT NULL,
    Correo VARCHAR(255) NOT NULL,
    Contraseña VARCHAR(255) NOT NULL,
    Nombre_Usuario VARCHAR(255) NOT NULL,
    Foto VARCHAR(255) NOT NULL,
    Estado ENUM('En línea', 'Desconectado') DEFAULT 'Desconectado'
);

CREATE TABLE Contacto (
    id_Contacto INT AUTO_INCREMENT PRIMARY KEY,
    id_Usuario INT NOT NULL,                  -- ID del usuario que tiene el contacto
    id_Contacto_Usuario INT NOT NULL,         -- ID del usuario que es el contacto
    FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_Contacto_Usuario) REFERENCES Usuario(id_Usuario) ON DELETE CASCADE
);

CREATE TABLE Mensaje (
    id_Mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_Usuario_Emisor INT NOT NULL,       -- ID del usuario que envía el mensaje
    id_Usuario_Receptor INT NOT NULL,     -- ID del usuario que recibe el mensaje
    Contenido TEXT NOT NULL,              -- Contenido del mensaje
    Fecha_Hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Fecha y hora del mensaje
    FOREIGN KEY (id_Usuario_Emisor) REFERENCES Usuario(id_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_Usuario_Receptor) REFERENCES Usuario(id_Usuario) ON DELETE CASCADE
);

CREATE TABLE Grupo (
    id_Grupo INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(255) NOT NULL,
    Foto VARCHAR(255) NOT NULL
);

CREATE TABLE Usuario_Grupo (
    id_Usuario INT NOT NULL,
    id_Grupo INT NOT NULL,
    PRIMARY KEY (id_Usuario, id_Grupo),  -- Clave primaria compuesta para evitar duplicados
    FOREIGN KEY (id_Usuario) REFERENCES Usuario(id_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_Grupo) REFERENCES Grupo(id_Grupo) ON DELETE CASCADE
);


INSERT INTO Usuario (Nombre, Apellido, Fecha_Nacimiento, Correo, Contraseña, Nombre_Usuario, Foto, Estado) VALUES 
('Cristian', 'Suárez', '2001-05-15', 'cristian.suarez@example.com', 'password1', 'CristianS', 'https://bootdey.com/img/Content/avatar/avatar1.png', 'En línea'),
('María', 'López', '2003-12-22', 'maria.lopez@example.com', 'password2', 'MaríaL', 'https://bootdey.com/img/Content/avatar/avatar8.png', 'Desconectado'),
('Juan', 'Pérez', '2002-07-08', 'juan.perez@example.com', 'password3', 'JuanP', 'https://bootdey.com/img/Content/avatar/avatar4.png', 'En línea'),
('Carlos', 'Juárez', '2003-09-14', 'carlos.juarez@example.com', 'password4', 'CarlosJ', 'https://bootdey.com/img/Content/avatar/avatar7.png', 'En línea'),
('Luis', 'Rodríguez', '2004-03-19', 'luis.rodriguez@example.com', 'password5', 'LuisR', 'https://bootdey.com/img/Content/avatar/avatar6.png', 'Desconectado'),
('Elena', 'García', '2000-11-02', 'elena.garcia@example.com', 'password6', 'ElenaG', 'https://bootdey.com/img/Content/avatar/avatar3.png', 'Desconectado'),
('Javier', 'Chávez', '2001-06-23', 'javier.chavez@example.com', 'password7', 'JavierC', 'https://bootdey.com/img/Content/avatar/avatar2.png', 'En línea'),
('Mónica', 'Beltrán', '2004-01-30', 'monica.beltran@example.com', 'password8', 'MónicaB', 'https://bootdey.com/img/Content/avatar/avatar8.png', 'Desconectado'),
('Miguel', 'Sánchez', '2003-08-17', 'miguel.sanchez@example.com', 'password9', 'MiguelS', 'https://bootdey.com/img/Content/avatar/avatar5.png', 'En línea'),
('Silvia', 'Alvarado', '2002-04-27', 'silvia.alvarado@example.com', 'password10', 'SilviaA', 'https://bootdey.com/img/Content/avatar/avatar3.png', 'En línea');

INSERT INTO Contacto (id_Usuario, id_Contacto_Usuario) VALUES 
(3, 1),  -- Juan Pérez (id_Usuario 3) con Cristian Suárez (id_Contacto_Usuario 1)
(3, 2),  -- Juan Pérez (id_Usuario 3) con María López (id_Contacto_Usuario 2)
(3, 4),  -- Juan Pérez (id_Usuario 3) con Carlos Juárez (id_Contacto_Usuario 4)
(3, 6),  -- Juan Pérez (id_Usuario 3) con Elena García (id_Contacto_Usuario 6)
(3, 8);  -- Juan Pérez (id_Usuario 3) con Mónica Beltrán (id_Contacto_Usuario 8)

INSERT INTO Contacto (id_Usuario, id_Contacto_Usuario) VALUES 
(9, 10),  -- Miguel Sánchez (id_Usuario 9) con Silvia Alvarado (id_Contacto_Usuario 10)
(9, 7),  -- Miguel Sánchez (id_Usuario 9) con Javier Chávez (id_Contacto_Usuario 7)
(9, 3);  -- Miguel Sánchez (id_Usuario 9) con Juan Pérez (id_Contacto_Usuario 3)

INSERT INTO Contacto (id_Usuario, id_Contacto_Usuario) VALUES 
(6, 1),  -- Elena García (id_Usuario 6) con Cristian Suárez (id_Contacto_Usuario 1)
(6, 4),  -- Elena García  (id_Usuario 6) con Carlos Juárez (id_Contacto_Usuario 4)
(6, 2),  -- Elena García  (id_Usuario 6) con María López (id_Contacto_Usuario 2)
(6, 9),  -- Elena García  (id_Usuario 6) con Miguel Sánchez (id_Contacto_Usuario 9)
(6, 10),  -- Elena García  (id_Usuario 6) con Silvia Alvarado (id_Contacto_Usuario 10)
(6, 3),  -- Elena García  (id_Usuario 6) con Juan Pérez (id_Contacto_Usuario 3)
(6, 5);  -- Elena García  (id_Usuario 6) con Luis Rodríguez (id_Contacto_Usuario 5)

INSERT INTO Contacto (id_Usuario, id_Contacto_Usuario) VALUES 
(1, 8),  -- Cristian Suárez (id_Usuario 1) con Mónica Beltrán (id_Contacto_Usuario 8)
(1, 3),  -- Cristian Suárez  (id_Usuario 1) con Juan Pérez (id_Contacto_Usuario 3)
(1, 6);  -- Cristian Suárez  (id_Usuario 1) con Elena García (id_Contacto_Usuario 6)

DROP TABLE Contacto;

SELECT * FROM Usuario;
SELECT * FROM Contacto;
SELECT * FROM Mensaje;
SELECT * FROM Usuario_Grupo;
SELECT * FROM Grupo;

DROP TABLE Usuario_Grupo;
DROP table Grupo;

DROP TABLE Mensaje;
DROP TABLE Contacto;
DROP TABLE Usuario;

INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora)
VALUES (6, 1, 'Hola, ¿cómo estás?', '2024-10-07 10:10:00'),
	   (1, 6, 'Muy bien, y tú?', '2024-10-07 10:11:00'),
       (6, 4, '¡Hola! Estoy bien, gracias.', '2024-10-07 11:12:00'),
       (4, 6, 'Me alegro, deberíamos vernos algún día', '2024-10-07 11:24:00');
       
       
UPDATE Mensaje SET Fecha_Hora = '2024-10-07 10:13:00'
WHERE id_Mensaje = 4;

DELETE FROM Mensaje
WHERE id_Mensaje = 6;

       
ALTER TABLE Mensaje
ADD COLUMN id_Grupo INT NULL,
ADD FOREIGN KEY (id_Grupo) REFERENCES Grupo(id_Grupo) ON DELETE CASCADE;


INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora, id_Grupo)
VALUES (4, 4, 'Este es un mensaje en el grupo 1', NOW(), 1);
INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora, id_Grupo)
VALUES (9, 9, 'Este es otro mensaje en el grupo 1', NOW(), 1);
INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora, id_Grupo)
VALUES (9, NULL, 'Este es otro otro mensaje en el grupo 1', NOW(), 1);

INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora, id_Grupo)
VALUES (6, NULL, 'Hola, soy Elena', NOW(), 1);

INSERT INTO Mensaje (id_Usuario_Emisor, id_Usuario_Receptor, Contenido, Fecha_Hora, id_Grupo)
VALUES (3, NULL, 'Otro mensaje de prueba', NOW(), 1);

ALTER TABLE Mensaje MODIFY COLUMN id_Usuario_Receptor INT NULL;

UPDATE Usuario SET Estado = 'Desconectado' WHERE id_Usuario =  1;
 