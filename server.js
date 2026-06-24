const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();

app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(express.json());

const storage = multer.diskStorage({

    destination: (req,file,cb)=>{

        cb(null,"uploads/");
    },

    filename: (req,file,cb)=>{

        const nombre =
            Date.now() +
            path.extname(file.originalname);

        cb(null,nombre);
    }

});

const upload = multer({
    storage
});

const conexion = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "portal_estudiantil"
});
conexion.connect((error) => {
    if (error) {
        console.log("Error de conexión:", error);
    } else {
        console.log("Conectado a MySQL");
    }
});
app.get("/", (req, res) => {
    res.send("Servidor funcionando correctamente");
});
app.post("/registrar", (req, res) => {

    const {
        nombre,
        password,
        rol,
        curso,
        especialidad,
        materias
    } = req.body;

    const sql = `
        INSERT INTO usuarios (
            nombre,
            password,
            rol
        )
        VALUES (?, ?, ?)
    `;

    conexion.query(
        sql,
        [nombre, password, rol],
        (error, resultado) => {

            if (error) {

                console.log(error);

                return res.status(500).json({
                    mensaje: "Error al registrar"
                });
            }

            // Si NO es alumno termina aquí
            if (rol === "docente") {

    if (!materias || materias.length === 0) {

        return res.json({
            mensaje: "Docente registrado sin materias"
        });
    }

    const docenteId = resultado.insertId;

    const sqlMaterias = `
        SELECT id, nombre
        FROM materias
        WHERE nombre IN (?)
    `;

    conexion.query(
        sqlMaterias,
        [materias],
        (errMaterias, materiasDB) => {

            if (errMaterias) {

                console.log(errMaterias);

                return res.status(500).json({
                    mensaje: "Error obteniendo materias"
                });
            }

            materiasDB.forEach(materia => {

                conexion.query(
                    `
                    INSERT INTO docente_materias
                    (
                        docente_id,
                        materia_id
                    )
                    VALUES (?, ?)
                    `,
                    [
                        docenteId,
                        materia.id
                    ]
                );

            });

            res.json({
                mensaje:
                    "Docente registrado correctamente"
            });

        }
    );

    return;
}

if (rol !== "alumno") {

    return res.json({
        mensaje:
            "Usuario registrado correctamente"
    });
}

            // Crear perfil automático para alumnos
            const sqlPerfil = `
                INSERT INTO perfiles (
                    usuario_id,
                    nombre,
                    curso,
                    especialidad,
                    estado_asignacion
                )
                VALUES (?, ?, ?, ?, 'pendiente')
            `;

            conexion.query(
                sqlPerfil,
                [
                    resultado.insertId,
                    nombre,
                    curso,
                    especialidad
                ],
                (errorPerfil) => {

                    if (errorPerfil) {

                        console.log(errorPerfil);

                        return res.status(500).json({
                            mensaje:
                                "Usuario creado pero error al crear perfil"
                        });
                    }

                    res.json({
                        mensaje:
                            "Alumno registrado correctamente"
                    });

                }
            );

        }
    );

});
app.post("/verificar-usuario", (req, res) => {

    const { nombre } = req.body;

    conexion.query(
        "SELECT * FROM usuarios WHERE nombre = ?",
        [nombre],
        (error, resultados) => {

            if (error) {
                return res.status(500).json({
                    existe: false
                });
            }

            res.json({
                existe: resultados.length > 0
            });

        }
    );

});
app.post("/login", (req, res) => {

    const { nombre, password } = req.body;

    conexion.query(
        "SELECT * FROM usuarios WHERE nombre = ? AND password = ?",
        [nombre, password],
        (error, resultados) => {

            if (error) {
                return res.status(500).json({
                    encontrado: false
                });
            }

            if (resultados.length > 0) {

                res.json({
                    encontrado: true,
                    usuario: resultados[0]
                });

            } else {

                res.json({
                    encontrado: false
                });

            }

        }
    );

});
app.post("/guardar-perfil", (req, res) => {

    const {
    usuario_id,
    nombre,
    cedula,
    nacimiento,
    ciudad,
    curso,
    paralelo,
    especialidad,
    madre,
    padre,
    telPadres,
    emergenciaNombre,
    emergenciaTel,
    emergenciaRel,
    foto
} = req.body;

    const sql = `
    INSERT INTO perfiles (
    usuario_id,
    nombre,
    cedula,
    nacimiento,
    ciudad,
    curso,
    paralelo,
    especialidad,
    estado_asignacion,
    madre,
    padre,
    tel_padres,
    emergencia_nombre,
    emergencia_tel,
    emergencia_rel,
    foto
)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const fechaNacimiento = nacimiento || null;
    conexion.query(
        sql,
        [
            usuario_id,
            nombre,
            cedula,
            nacimiento,
            ciudad,
            curso,
            paralelo,
            especialidad,
            "pendiente",
            madre,
            padre,
            telPadres,
            emergenciaNombre,
            emergenciaTel,
            emergenciaRel,
            foto
        ],
        (error) => {

            if (error) {
                console.log(error);
                return res.status(500).json({
                    mensaje: "Error al guardar perfil"
                });
            }

            res.json({
                mensaje: "Perfil guardado correctamente"
            });

        }
    );

});
app.post("/guardar-perfil-docente", (req, res) => {

    const {
        usuario_id,
        titulo,
        materia,
        correo,
        telefono,
        experiencia,
        frase,
        presentacion,
        formacion,
        foto
    } = req.body;

    const sql = `
        INSERT INTO perfil_docente
        (
            usuario_id,
            titulo,
            materia,
            correo,
            telefono,
            experiencia,
            frase,
            presentacion,
            formacion,
            foto
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
        sql,
        [
            usuario_id,
            titulo,
            materia,
            correo,
            telefono,
            experiencia,
            frase,
            presentacion,
            formacion,
            foto
        ],
        (error) => {

            if(error){

                console.log(error);

                return res.status(500).json({
                    ok:false
                });
            }

            res.json({
                ok:true
            });
        }
    );
});
app.get("/usuarios", (req, res) => {
    conexion.query("SELECT * FROM usuarios", (error, results) => {

        if (error) {
            console.log(error);
            return res.status(500).json([]);
        }

        res.json(results);
    });
});
app.post("/asignar-usuario", (req, res) => {

    const { nombre, paralelo } = req.body;

    const sql = `
        UPDATE usuarios 
        SET asignado = 1, paralelo = ? 
        WHERE nombre = ?
    `;

    conexion.query(sql, [paralelo, nombre], (error) => {

        if (error) {
            console.log(error);
            return res.status(500).json({
                mensaje: "Error al asignar usuario"
            });
        }

        res.json({
            mensaje: "Usuario asignado correctamente"
        });
    });
});
app.get("/paralelos", (req, res) => {

    const sql = `
        SELECT *
        FROM perfiles
        WHERE estado_asignacion = 'asignado'
    `;

    conexion.query(sql, (error, results) => {

        if (error) {
            console.log(error);
            return res.status(500).json([]);
        }

        res.json(results);
    });

});
app.post("/eliminar-usuario", (req, res) => {

    const { id } = req.body;

    // Primero eliminar perfil
    conexion.query(
        "DELETE FROM perfiles WHERE usuario_id = ?",
        [id],
        (errorPerfil) => {

            if (errorPerfil) {
                console.log(errorPerfil);

                return res.status(500).json({
                    mensaje: "Error eliminando perfil"
                });
            }

            // Luego eliminar usuario
            conexion.query(
                "DELETE FROM usuarios WHERE id = ?",
                [id],
                (errorUsuario) => {

                    if (errorUsuario) {
                        console.log(errorUsuario);

                        return res.status(500).json({
                            mensaje: "Error eliminando usuario"
                        });
                    }

                    res.json({
                        success: true,
                        message: "Alumno eliminado correctamente"
                    });

                }
            );

        }
    );

});
app.get("/alumnos-pendientes", (req, res) => {

    const sql = `
        SELECT
            p.*,
            u.nombre
        FROM perfiles p
        INNER JOIN usuarios u
            ON p.usuario_id = u.id
        WHERE p.estado_asignacion = 'pendiente'
    `;

    conexion.query(sql, (error, results) => {

        if (error) {
            console.log(error);
            return res.status(500).json([]);
        }

        res.json(results);

    });

});
app.post("/asignar-alumno", (req, res) => {

    const {
        usuario_id,
        paralelo
    } = req.body;

    const sql = `
        UPDATE perfiles
        SET
            paralelo = ?,
            estado_asignacion = 'asignado'
        WHERE usuario_id = ?
    `;

    conexion.query(
        sql,
        [paralelo, usuario_id],
        (error) => {

            if (error) {
                console.log(error);

                return res.status(500).json({
                    mensaje: "Error al asignar alumno"
                });
            }

            res.json({
                success: true,
                mensaje: "Alumno asignado correctamente"
            });

        }
    );

});
app.post("/guardar-conducta", (req, res) => {

    const {
        alumno_usuario,
        nombre_alumno,
        materia,
        rango,
        observaciones,
        fecha,
        hora,
        docente
    } = req.body;

    const sql = `
        INSERT INTO conductas
        (
            alumno_usuario,
            nombre_alumno,
            materia,
            rango,
            observaciones,
            fecha,
            hora,
            docente
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
        sql,
        [
            alumno_usuario,
            nombre_alumno,
            materia,
            rango,
            observaciones,
            fecha,
            hora,
            docente
        ],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                mensaje: "Conducta guardada"
            });
        }
    );
});
app.get("/conductas/:alumno", (req, res) => {

    const alumno = req.params.alumno;

    conexion.query(
        "SELECT * FROM conductas WHERE alumno_usuario = ? ORDER BY id DESC",
        [alumno],
        (err, resultados) => {

            if (err) {
                console.error(err);

                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );
});
app.post("/guardar-nota", (req, res) => {

    const {
        alumno_id,
        docente_id,
        materia_id,
        p1,
        p2,
        examen,
        promedio
    } = req.body;

    const sql = `
        INSERT INTO notas
        (
            alumno_id,
            docente_id,
            materia_id,
            p1,
            p2,
            examen,
            promedio
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    conexion.query(
        sql,
        [
            alumno_id,
            docente_id,
            materia_id,
            p1,
            p2,
            examen,
            promedio
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: err.message
                });

            }

            res.json({
                mensaje: "Nota guardada"
            });

        }
    );

});
app.post("/crear-foro", (req, res) => {

    const {
        pregunta,
        docente,
        fecha,
        timestamp
    } = req.body;

    conexion.query(
        `
        INSERT INTO foros
        (
            pregunta,
            docente,
            fecha,
            timestamp
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            pregunta,
            docente,
            fecha,
            timestamp
        ],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                mensaje: "Foro creado"
            });
        }
    );
});
app.get("/foros", (req, res) => {

    conexion.query(
        "SELECT * FROM foros ORDER BY id DESC",
        (err, resultados) => {

            if (err) {
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );
});
app.post("/responder-foro", (req, res) => {

    const {
        foro_id,
        alumno,
        texto,
        fecha
    } = req.body;

    conexion.query(
        `
        INSERT INTO respuestas_foro
        (
            foro_id,
            alumno,
            texto,
            fecha
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            foro_id,
            alumno,
            texto,
            fecha
        ],
        (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                mensaje: "Respuesta guardada"
            });
        }
    );
});
app.get("/respuestas-foro/:id", (req, res) => {

    conexion.query(
        `
        SELECT *
        FROM respuestas_foro
        WHERE foro_id = ?
        `,
        [req.params.id],
        (err, resultados) => {

            if (err) {
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );
});
app.post("/eliminar-foro", (req, res) => {

    const { id } = req.body;

    conexion.query(
        "DELETE FROM respuestas_foro WHERE foro_id = ?",
        [id],
        () => {

            conexion.query(
                "DELETE FROM foros WHERE id = ?",
                [id],
                (err) => {

                    if (err) {
                        return res.status(500).json(err);
                    }

                    res.json({
                        mensaje: "Foro eliminado"
                    });
                }
            );
        }
    );
});
app.get("/perfil/:usuarioId", (req, res) => {

    conexion.query(
        `
        SELECT *
        FROM perfiles
        WHERE usuario_id = ?
        LIMIT 1
        `,
        [req.params.usuarioId],
        (err, resultados) => {

            if (err) {
                console.error(err);
                return res.status(500).json({});
            }

            if (resultados.length === 0) {
                return res.json({});
            }

            res.json(resultados[0]);
        }
    );
});
app.post("/guardar-asistencia", (req, res) => {

    const {
        alumno_id,
        fecha,
        estado
    } = req.body;

    conexion.query(
        `
        INSERT INTO asistencias
        (
            alumno_id,
            fecha,
            estado
        )
        VALUES (?, ?, ?)

        ON DUPLICATE KEY UPDATE
            estado = VALUES(estado)
        `,
        [
            alumno_id,
            fecha,
            estado
        ],
        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Error guardando asistencia"
                });

            }

            res.json({
                mensaje: "Asistencia guardada"
            });

        }
    );

});
app.get("/alumnos-asistencia", (req,res)=>{

    const {
        curso,
        paralelo,
        especialidad
    } = req.query;

    conexion.query(
        `
        SELECT
            usuario_id AS id,
            nombre,
            curso,
            paralelo,
            especialidad
        FROM perfiles
        WHERE curso = ?
        AND paralelo = ?
        AND (
            especialidad = ?
            OR ? = ''
        )
        ORDER BY nombre
        `,
        [
            curso,
            paralelo,
            especialidad,
            especialidad
        ],
        (err,resultados)=>{

            if(err){

                console.error(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }
    );

});
app.get("/asistencias/:alumnoId", (req,res)=>{

    conexion.query(
        `
        SELECT *
        FROM asistencias
        WHERE alumno_id = ?
        ORDER BY fecha
        `,
        [req.params.alumnoId],
        (err,resultados)=>{

            if(err){
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );

});
app.get("/cursos-asistencia", (req,res)=>{

    conexion.query(
        `
       SELECT
            curso,
            paralelo,
            especialidad,
            COUNT(*) AS total_alumnos
        FROM perfiles
        WHERE curso IS NOT NULL
        AND paralelo IS NOT NULL
        GROUP BY
            curso,
            paralelo,
            especialidad
        `,
        (err,resultados)=>{

            if(err){
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );

});
app.get("/asistencias-paralelo", (req,res)=>{

    const {
        curso,
        paralelo,
        especialidad
    } = req.query;

    conexion.query(
        `
        SELECT
            a.*,
            p.nombre,
            p.curso,
            p.paralelo,
            p.especialidad
        FROM asistencias a
        INNER JOIN perfiles p
            ON a.alumno_id = p.usuario_id
        WHERE p.curso = ?
        AND p.paralelo = ?
        AND (
            p.especialidad = ?
            OR ? = ''
        )
        ORDER BY a.fecha
        `,
        [
            curso,
            paralelo,
            especialidad || "",
            especialidad || ""
        ],
        (err,resultados)=>{

            if(err){

                console.error(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }
    );

});
app.post("/asignar-materia", (req,res)=>{

    const {
        docente_id,
        materia_id
    } = req.body;

    conexion.query(
        `
        UPDATE usuarios
        SET
            materia_asignada = ?,
            estado_materias = 'aprobado'
        WHERE id = ?
        `,
        [
            materia_id,
            docente_id
        ],
        (err)=>{

            if(err){
                console.error(err);

                return res.status(500).json({
                    error:"Error asignando materia"
                });
            }

            res.json({
                mensaje:"Materia asignada correctamente"
            });
        }
    );

});
app.post("/editar-materia",(req,res)=>{

    const {
        id,
        materia_id
    } = req.body;

    conexion.query(
        `
        UPDATE docente_materias
        SET materia_id = ?
        WHERE id = ?
        `,
        [
            materia_id,
            id
        ],
        (err)=>{

            if(err){
                return res.status(500).json({
                    error:"Error actualizando"
                });
            }

            res.json({
                mensaje:"Actualizada"
            });
        }
    );

});
app.get("/docentes", (req, res) => {

    conexion.query(
        `
        SELECT *
        FROM usuarios
        WHERE rol = 'docente'
        `,
        (err, resultados) => {

            if(err){
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );

});
app.get("/configuracion", (req,res)=>{

    conexion.query(
        "SELECT * FROM configuracion LIMIT 1",
        (err,resultados)=>{

            if(err){
                return res.status(500).json({});
            }

            res.json(resultados[0] || {});
        }
    );

});
app.post("/configuracion",(req,res)=>{

    const { fechaInicio } = req.body;

    conexion.query(
        `
        INSERT INTO configuracion(fechaInicio)
        VALUES(?)
        `,
        [fechaInicio],
        (err)=>{

            if(err){
                return res.status(500).json({});
            }

            res.json({
                mensaje:"Guardado"
            });
        }
    );

});
app.get("/notas/:id", (req,res)=>{

    conexion.query(
        `
        SELECT *
        FROM notas
        WHERE alumno_id = ?
        `,
        [req.params.id],
        (err,resultados)=>{

            if(err){
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );

});
app.get("/fecha-inicio/:docenteId", (req,res)=>{

    conexion.query(
        `
        SELECT fecha_inicio
        FROM fecha_inicio_docente
        WHERE docente_id = ?
        `,
        [req.params.docenteId],
        (err,resultados)=>{

            if(err){

                console.error(err);

                return res.status(500).json({
                    ok:false
                });

            }

            res.json({
                fechaInicio:
                    resultados.length
                    ? resultados[0].fecha_inicio
                    : null
            });

        }
    );

});
app.post("/guardar-fecha-inicio", (req,res)=>{

    const {
        docente_id,
        fechaInicio
    } = req.body;

    conexion.query(
        `
        INSERT INTO fecha_inicio_docente
        (
            docente_id,
            fecha_inicio
        )
        VALUES (?,?)
        ON DUPLICATE KEY UPDATE
        fecha_inicio = VALUES(fecha_inicio)
        `,
        [
            docente_id,
            fechaInicio
        ],
        (err)=>{

            if(err){

                console.error(err);

                return res.status(500).json({
                    ok:false
                });

            }

            res.json({
                ok:true
            });

        }
    );

});
app.get("/solicitudes-docentes", (req, res) => {

    conexion.query(
        `
        SELECT
            u.id,
            u.nombre,
            GROUP_CONCAT(m.nombre SEPARATOR ', ') AS materias
        FROM usuarios u
        LEFT JOIN docente_materias dm
            ON u.id = dm.docente_id
        LEFT JOIN materias m
            ON dm.materia_id = m.id
        WHERE u.rol = 'docente'
        AND (
            u.estado_materias IS NULL
            OR u.estado_materias = 'pendiente'
        )
        GROUP BY u.id, u.nombre
        `,
        (err, resultados) => {

            if (err) {

                console.error(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }
    );

});
app.get("/docentes-asignados", (req,res)=>{

    conexion.query(
        `
        SELECT
            u.id,
            u.nombre AS docente,
            m.nombre AS materia
        FROM usuarios u
        INNER JOIN materias m
            ON u.materia_asignada = m.id
        WHERE u.rol = 'docente'
        AND u.estado_materias = 'aprobado'
        `,
        (err,resultados)=>{

            if(err){
                console.error(err);
                return res.status(500).json([]);
            }

            res.json(resultados);
        }
    );

});
app.get("/datos-docente/:id", (req,res)=>{

    const id = req.params.id;

    conexion.query(
        `
        SELECT
            u.nombre,
            m.nombre AS materia
        FROM usuarios u
        LEFT JOIN materias m
            ON u.materia_asignada = m.id
        WHERE u.id = ?
        `,
        [id],
        (err,resultados)=>{

            if(err){
                console.error(err);

                return res.status(500).json({
                    ok:false
                });
            }

            if(resultados.length === 0){

                return res.json({
                    ok:false
                });
            }

            res.json({
                ok:true,
                docente: resultados[0]
            });

        }
    );

});
app.get("/perfil-docente/:id", (req,res)=>{

    const id = req.params.id;

    conexion.query(
        `
        SELECT
        u.nombre,
        u.materia_asignada,
        p.*
        FROM usuarios u
        INNER JOIN perfil_docente p
            ON u.id = p.usuario_id
        WHERE p.usuario_id = ?
        ORDER BY p.id DESC
        LIMIT 1
        `,
        [id],
        (err,resultados)=>{

            if(err){

                console.error(err);

                return res.status(500).json({
                    ok:false
                });

            }

            if(resultados.length === 0){

                return res.json({
                    ok:false
                });

            }
            const materias = {
                1: "Matemática",
                2: "Inglés",
                3: "Ciudadanía",
                4: "Química",
                5: "Emprendimiento",
                6: "Lengua y Literatura",
                7: "Biología",
                8: "Historia",
                9: "Educación Física",
                10: "Tutoría",
                11: "Proyecto",
                12: "Computación"
            };

            resultados[0].materia =
                materias[Number(resultados[0].materia_asignada)] ||
                "Sin asignar";

            res.json({
                ok:true,
                perfil: resultados[0]
            });

        }
    );

});
app.get("/materia-docente/:id", (req,res)=>{

    const id = req.params.id;

    conexion.query(
        `
        SELECT
            m.nombre AS materia
        FROM usuarios u
        INNER JOIN materias m
            ON u.materia_asignada = m.id
        WHERE u.id = ?
        `,
        [id],
        (err,resultados)=>{

            if(err){
                return res.status(500).json({
                    ok:false
                });
            }

            res.json({
                ok:true,
                materia:
                    resultados[0]?.materia
            });
        }
    );

});
app.post("/eliminar-docente", (req, res) => {

    const { id } = req.body;

    conexion.query(
        `
        DELETE FROM docente_materias
        WHERE docente_id = ?
        `,
        [id],
        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    error: "Error eliminando materias"
                });

            }

            conexion.query(
                `
                DELETE FROM usuarios
                WHERE id = ?
                `,
                [id],
                (err2) => {

                    if (err2) {

                        console.error(err2);

                        return res.status(500).json({
                            error: "Error eliminando docente"
                        });

                    }

                    res.json({
                        success: true
                    });

                }
            );

        }
    );

});
app.listen(3000, () => {
    console.log("Servidor ejecutándose en puerto 3000");
});