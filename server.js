const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();

app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// Crear una conexión con la base de datos MySQL
const conexion = mysql.createConnection({

    // Dirección del servidor donde se encuentra la base de datos
    host: "localhost",

    // Usuario con permisos para acceder a MySQL
    user: "root",

    // Contraseña del usuario de MySQL
    password: "123456",

    // Nombre de la base de datos que utilizará la aplicación
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
// Ruta que permite registrar un nuevo usuario
app.post("/registrar", (req, res) => {

    // Obtener los datos enviados desde el formulario
    const {
        nombre,
        password,
        rol,
        curso,
        especialidad,
        materias
    } = req.body;

    // Consulta SQL para insertar el usuario en la tabla usuarios
    const sql = `
        INSERT INTO usuarios (
            nombre,
            password,
            rol
        )
        VALUES (?, ?, ?)
    `;

    // Ejecutar la consulta en la base de datos
    conexion.query(
        sql,
        [nombre, password, rol],
        (error, resultado) => {

            // Verificar si ocurrió un error durante el registro
            if (error) {
                console.log(error);

                return res.status(500).json({
                    mensaje: "Error al registrar"
                });
            }

            // Si el usuario registrado es un docente
            if (rol === "docente") {

                // Verificar que tenga materias asignadas
                if (!materias || materias.length === 0) {

                    return res.json({
                        mensaje: "Docente registrado sin materias"
                    });
                }

                // Obtener el ID del docente recién creado
                const docenteId = resultado.insertId;

                // Buscar las materias seleccionadas
                const sqlMaterias = `
                    SELECT id, nombre
                    FROM materias
                    WHERE nombre IN (?)
                `;

                conexion.query(
                    sqlMaterias,
                    [materias],
                    (errMaterias, materiasDB) => {

                        // Asociar cada materia al docente
                        materiasDB.forEach(materia => {

                            conexion.query(
                                `
                                INSERT INTO docente_materias
                                (docente_id, materia_id)
                                VALUES (?, ?)
                                `,
                                [
                                    docenteId,
                                    materia.id
                                ]
                            );

                        });

                        // Confirmar el registro del docente
                        res.json({
                            mensaje: "Docente registrado correctamente"
                        });

                    }
                );

                return;
            }

            // Si es un alumno, crear automáticamente su perfil
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
                () => {

                    // Confirmar el registro del alumno
                    res.json({
                        mensaje: "Alumno registrado correctamente"
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
// Ruta para iniciar sesión
app.post("/login", (req, res) => {

    const { nombre, password } = req.body;

    conexion.query(
        "SELECT * FROM usuarios WHERE nombre = ? AND password = ?",
        [nombre, password],
        (error, resultados) => {

            if(error){

                console.error(error);

                return res.status(500).json({
                    encontrado:false
                });

            }

            if(resultados.length > 0){

                return res.json({
                    encontrado:true,
                    usuario:{
                        id:resultados[0].id,
                        nombre:resultados[0].nombre,
                        rol:resultados[0].rol
                    }
                });

            }

            return res.json({
                encontrado:false
            });

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

    conexion.query(

        "SELECT id FROM perfiles WHERE usuario_id=?",

        [usuario_id],

        (err, resultado) => {

            if(err){

                console.error(err);

                return res.status(500).json({
                    mensaje:"Error"
                });

            }

            if(resultado.length>0){

                // YA EXISTE → ACTUALIZAR

                conexion.query(

                    `
                    UPDATE perfiles
                    SET
                        nombre=?,
                        cedula=?,
                        nacimiento=?,
                        ciudad=?,
                        curso=?,
                        paralelo=?,
                        especialidad=?,
                        madre=?,
                        padre=?,
                        tel_padres=?,
                        emergencia_nombre=?,
                        emergencia_tel=?,
                        emergencia_rel=?,
                        foto=?,
                        puede_editar=0
                    WHERE usuario_id=?
                    `,

                    [
                        nombre,
                        cedula,
                        nacimiento || null,
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
                        foto,
                        usuario_id
                    ],

                    (err)=>{

                        if(err){

                            console.error(err);

                            return res.status(500).json({
                                mensaje:"Error al actualizar"
                            });

                        }

                        res.json({
                            mensaje:"Perfil actualizado correctamente"
                        });

                    }

                );

            }else{

                // NO EXISTE → INSERTAR

                conexion.query(

                    `
                    INSERT INTO perfiles
                    (
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
                        foto,
                        puede_editar
                    )
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    `,

                    [
                        usuario_id,
                        nombre,
                        cedula,
                        nacimiento || null,
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
                        foto,
                        0
                    ],

                    (err)=>{

                        if(err){

                            console.error(err);

                            return res.status(500).json({
                                mensaje:"Error al guardar"
                            });

                        }

                        res.json({
                            mensaje:"Perfil guardado correctamente"
                        });

                    }

                );

            }

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

    conexion.query(
        `
        SELECT id
        FROM conductas
        WHERE alumno_usuario = ?
        AND materia = ?
        `,
        [alumno_usuario, materia],
        (err, resultados) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    error: err.message
                });
            }

            // Ya existe -> ACTUALIZAR
            if (resultados.length > 0) {

                conexion.query(
                    `
                    UPDATE conductas
                    SET
                        rango = ?,
                        observaciones = ?,
                        fecha = ?,
                        hora = ?,
                        docente = ?
                    WHERE alumno_usuario = ?
                    AND materia = ?
                    `,
                    [
                        rango,
                        observaciones,
                        fecha,
                        hora,
                        docente,
                        alumno_usuario,
                        materia
                    ],
                    (err) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.json({
                            mensaje: "Conducta actualizada"
                        });
                    }
                );

            } else {

                // No existe -> INSERTAR
                conexion.query(
                    `
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
                    `,
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
                    (err) => {

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
            }
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
        INSERT INTO foro
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
                console.error("ERROR CREAR FORO:", err);
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
        "SELECT * FROM foro ORDER BY id DESC",
        (err, resultados) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
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
        SELECT *
        FROM respuestas_foro
        WHERE foro_id = ?
        AND alumno = ?
        `,
        [foro_id, alumno],
        (err, resultados) => {

            if (err) {
                return res.status(500).json(err);
            }

            if (resultados.length > 0) {

                conexion.query(
                    `
                    UPDATE respuestas_foro
                    SET texto = ?, fecha = ?
                    WHERE foro_id = ?
                    AND alumno = ?
                    `,
                    [
                        texto,
                        fecha,
                        foro_id,
                        alumno
                    ],
                    (err) => {

                        if (err) {
                            return res.status(500).json(err);
                        }

                        res.json({
                            mensaje: "Respuesta actualizada"
                        });
                    }
                );

            } else {

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
            }
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
                "DELETE FROM foro WHERE id = ?",
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
app.post("/restablecer-fecha", (req, res) => {

    const { autorizacionId } = req.body;
    conexion.query(
        "DELETE FROM asistencias",
        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al eliminar asistencias"
                });

            }

            conexion.query(
                "DELETE FROM fecha_inicio_docente",
                (err) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al eliminar fechas"
                        });

                    }

                    conexion.query(
    `
                        UPDATE autorizaciones
                        SET estado='ejecutado'
                        WHERE id=?
                        `,
                        [autorizacionId],
                        (err)=>{

                            if(err){

                                console.error(err);

                                return res.status(500).json({
                                    ok:false
                                });

                            }

                            res.json({
                                ok:true,
                                mensaje:"Restablecimiento realizado correctamente."
                            });

                        }
                    );

                }
            );

        }
    );

});
app.post("/guardar-fecha-inicio", (req,res)=>{
    console.log("Body recibido:", req.body);

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
            m.id,
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
                materia_id: resultados[0]?.id,
                materia: resultados[0]?.materia
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
app.post("/quizzes", (req, res) => {

    const {
        titulo,
        materia_id,
        docente_id,
        preguntas
    } = req.body;

    conexion.query(
        `INSERT INTO quizzes
        (titulo,materia_id,docente_id)
        VALUES (?,?,?)`,
        [titulo,materia_id,docente_id],
        (err, resultado) => {

            if(err){
                console.log(err);
                return res.status(500).json(err);
            }

            const quizId = resultado.insertId;

            const valores = preguntas.map(p => [
                quizId,
                p.pregunta,
                p.opcion_a,
                p.opcion_b,
                p.opcion_c,
                p.opcion_d,
                p.respuesta_correcta
            ]);

            conexion.query(
                `INSERT INTO preguntas_quiz
                (quiz_id,pregunta,
                opcion_a,opcion_b,
                opcion_c,opcion_d,
                respuesta_correcta)
                VALUES ?`,
                [valores],
                (err2) => {

                    if(err2){
                        console.log(err2);
                        return res.status(500).json(err2);
                    }

                    res.json({
                        mensaje:"Quiz guardado"
                    });
                }
            );
        }
    );
});
app.get("/quizzes", (req,res)=>{

    conexion.query(
        `
        SELECT
        q.id,
        q.titulo,
        m.nombre AS materia
        FROM quizzes q
        JOIN materias m
        ON q.materia_id = m.id
        `,
        (err,resultados)=>{

            if(err){
                return res.status(500).json(err);
            }

            res.json(resultados);
        }
    );
});
app.get("/quizzes/:id", (req,res)=>{

    const id = req.params.id;

    conexion.query(
        `
        SELECT *
        FROM quizzes
        WHERE id = ?
        `,
        [id],
        (err,quiz)=>{

            if(err){
                return res.status(500).json(err);
            }

            if(quiz.length === 0){
                return res.status(404).json({
                    mensaje:"Quiz no encontrado"
                });
            }

            conexion.query(
                `
                SELECT *
                FROM preguntas_quiz
                WHERE quiz_id = ?
                `,
                [id],
                (err2,preguntas)=>{

                    if(err2){
                        return res.status(500).json(err2);
                    }

                    res.json({
                        id: quiz[0].id,
                        titulo: quiz[0].titulo,
                        preguntas: preguntas
                    });
                }
            );
        }
    );
});
app.post("/resultados_quiz",(req,res)=>{

    const {
        quiz_id,
        estudiante_id,
        aciertos,
        total_preguntas,
        puntaje
    } = req.body;

    conexion.query(
        `
        INSERT INTO resultados_quiz
        (
            quiz_id,
            estudiante_id,
            aciertos,
            total_preguntas,
            puntaje
        )
        VALUES (?,?,?,?,?)
        `,
        [
            quiz_id,
            estudiante_id,
            aciertos,
            total_preguntas,
            puntaje
        ],
        (err,resultado)=>{

            if(err){
                return res.status(500).json(err);
            }

            res.json({
                mensaje:"Resultado guardado"
            });
        }
    );
});
app.get("/quiz-respondido/:quizId/:estudianteId", (req,res)=>{

    const { quizId, estudianteId } = req.params;

    conexion.query(
        `
        SELECT id
        FROM resultados_quiz
        WHERE quiz_id = ?
        AND estudiante_id = ?
        `,
        [quizId, estudianteId],
        (err, resultado)=>{

            if(err){
                return res.status(500).json(err);
            }

            res.json({
                respondido: resultado.length > 0
            });
        }
    );

});

// =====================================================
// 🔥 AGREGAR ESTE ENDPOINT TEMPORAL PARA DEBUG
// =====================================================

app.get("/debug-resultados", (req, res) => {

    conexion.query(
        `
        SELECT 
            rq.*,
            q.titulo AS quiz_titulo,
            q.docente_id,
            u.nombre AS alumno_nombre
        FROM resultados_quiz rq
        LEFT JOIN quizzes q ON rq.quiz_id = q.id
        LEFT JOIN usuarios u ON rq.estudiante_id = u.id
        ORDER BY rq.id DESC
        LIMIT 20
        `,
        (err, resultados) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }
            res.json({
                total: resultados.length,
                datos: resultados
            });
        }
    );

});

app.get("/debug-quizzes/:docenteId", (req, res) => {

    const docenteId = req.params.docenteId;

    conexion.query(
        `
        SELECT 
            q.*,
            m.nombre AS materia_nombre
        FROM quizzes q
        LEFT JOIN materias m ON q.materia_id = m.id
        WHERE q.docente_id = ?
        `,
        [docenteId],
        (err, resultados) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                docente_id: docenteId,
                total_quizzes: resultados.length,
                quizzes: resultados
            });
        }
    );

});
// =====================================================
// 🔥 ENDPOINT CORREGIDO - RESULTADOS QUIZZIZ
// =====================================================

app.get("/resultados-quiz-docente/:docenteId", (req, res) => {

    const docenteId = parseInt(req.params.docenteId);

    if (isNaN(docenteId)) {
        return res.status(400).json({ 
            error: "ID de docente inválido" 
        });
    }

    // Consulta simplificada y directa
    const sql = `
        SELECT 
            rq.id,
            rq.quiz_id,
            rq.estudiante_id,
            rq.aciertos,
            rq.total_preguntas,
            rq.puntaje,
            rq.fecha_registro,
            q.titulo AS quiz_titulo,
            u.nombre AS alumno_nombre
        FROM resultados_quiz rq
        INNER JOIN quizzes q ON rq.quiz_id = q.id
        INNER JOIN usuarios u ON rq.estudiante_id = u.id
        WHERE q.docente_id = ?
        ORDER BY rq.fecha_registro DESC, rq.id DESC
    `;

    conexion.query(sql, [docenteId], (err, resultados) => {
        if (err) {
            console.error("❌ Error en resultados-quiz-docente:", err);
            return res.status(500).json({ 
                error: err.message 
            });
        }

        console.log(`✅ ${resultados.length} resultados encontrados para docente ${docenteId}`);
        res.json(resultados);
    });

});

app.listen(3000, () => {
    console.log("Servidor ejecutándose en puerto 3000");
});

//AQUI SAHID
app.post("/solicitar-restablecer-asistencia", (req, res) => {

    const { rector_id } = req.body;

    // Verificar si ya existe una solicitud pendiente
    conexion.query(
        `
        SELECT id
        FROM autorizaciones
        WHERE accion = 'restablecer_asistencia'
        AND solicitado_por = ?
        AND estado = 'pendiente'
        `,
        [rector_id],
        (err, resultados) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    ok: false
                });

            }

            // Ya existe una solicitud pendiente
            if (resultados.length > 0) {

                return res.json({
                    ok: false,
                    mensaje: "Ya existe una solicitud pendiente."
                });

            }

            // Crear la nueva solicitud
            conexion.query(
                `
                INSERT INTO autorizaciones
                (
                    accion,
                    descripcion,
                    solicitado_por
                )
                VALUES
                (
                    'restablecer_asistencia',
                    'Solicitud para restablecer el ciclo de asistencia.',
                    ?
                )
                `,
                [rector_id],
                (err) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json({
                            ok: false
                        });

                    }

                    res.json({
                        ok: true,
                        mensaje: "Solicitud enviada correctamente."
                    });

                }
            );

        }
    );

});
app.get("/autorizaciones-pendientes", (req, res) => {

    conexion.query(
        `
        SELECT
            a.*,
            u.nombre
        FROM autorizaciones a
        INNER JOIN usuarios u
            ON a.solicitado_por = u.id
        WHERE a.estado = 'pendiente'
        ORDER BY a.fecha DESC
        `,
        (err, resultados) => {

            if(err){

                console.error(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }
    );

});
app.post("/aprobar-autorizacion", (req, res) => {

    const {
        id,
        soporte_id
    } = req.body;

    conexion.query(
        `
        UPDATE autorizaciones
        SET
            estado='aprobado',
            autorizado_por=?
        WHERE id=?
        `,
        [
            soporte_id,
            id
        ],
        (err) => {

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
app.get("/autorizacion-restablecimiento/:rectorId", (req, res) => {

    conexion.query(
        `
        SELECT id
        FROM autorizaciones
        WHERE accion = 'restablecer_asistencia'
        AND solicitado_por = ?
        AND estado = 'aprobado'
        ORDER BY fecha DESC
        LIMIT 1
        `,
        [req.params.rectorId],
        (err, resultados) => {

            if(err){

                console.error(err);

                return res.status(500).json({
                    autorizado:false
                });

            }

            res.json({

                autorizado: resultados.length > 0,

                autorizacionId:
                    resultados.length
                    ? resultados[0].id
                    : null

            });

        }
    );

});
app.post("/crear-ticket", (req, res) => {

    const {

        usuario_id,
        nombre_usuario,
        rol,
        categoria,
        asunto,
        descripcion

    } = req.body;

    conexion.query(
        `
        INSERT INTO tickets_soporte
        (
            usuario_id,
            nombre_usuario,
            rol,
            categoria,
            asunto,
            descripcion
        )
        VALUES
        (
            ?,?,?,?,?,?
        )
        `,
        [
            usuario_id,
            nombre_usuario,
            rol,
            categoria,
            asunto,
            descripcion
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
app.get("/tickets-soporte", (req, res) => {

    conexion.query(
        `
        SELECT *
        FROM tickets_soporte
        ORDER BY fecha DESC
        `,
        (err, resultados) => {

            if(err){

                console.error(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }

    );

});
app.post("/responder-ticket", (req, res) => {

    const {
        id,
        respuesta
    } = req.body;

    conexion.query(

        `
        UPDATE tickets_soporte
        SET
            respuesta = ?,
            estado = 'resuelto'
        WHERE id = ?
        `,

        [
            respuesta,
            id
        ],

        (err) => {

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
app.get("/mis-tickets/:usuarioId", (req, res) => {

    const usuarioId = req.params.usuarioId;

    conexion.query(

        `
        SELECT *
        FROM tickets_soporte
        WHERE usuario_id=?
        ORDER BY fecha DESC
        `,

        [usuarioId],

        (err, resultados)=>{

            if(err){

                console.error(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }

    );

});
app.get("/notificaciones-soporte/:id", (req, res) => {

    const id = req.params.id;

    conexion.query(

        `
        SELECT COUNT(*) AS total
        FROM tickets_soporte
        WHERE usuario_id = ?
        AND estado = 'resuelto'
        AND visto_usuario = 0
        `,

        [id],

        (err, resultado) => {

            if(err){

                console.error(err);

                return res.status(500).json({
                    total:0
                });

            }

            res.json(resultado[0]);

        }

    );

});
app.put("/tickets-soporte/visto/:id", (req,res)=>{

    conexion.query(

        `
        UPDATE tickets_soporte
        SET visto_usuario = 1
        WHERE id = ?
        `,

        [req.params.id],

        (err)=>{

            if(err){

                console.error(err);

                return res.sendStatus(500);

            }

            res.sendStatus(200);

        }

    );

});
app.put("/ticket-visto/:id",(req,res)=>{

    conexion.query(

        `
        UPDATE tickets_soporte
        SET visto_usuario = 1
        WHERE id = ?
        `,

        [req.params.id],

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
app.get("/tickets-no-vistos/:usuario",(req,res)=>{

    conexion.query(

        `
        SELECT COUNT(*) AS total
        FROM tickets_soporte
        WHERE usuario_id = ?
        AND estado = 'resuelto'
        AND visto_usuario = 0
        `,

        [req.params.usuario],

        (err,resultados)=>{

            if(err){

                console.error(err);
                return res.json({
                    total:0
                });

            }

            res.json(resultados[0]);

        }

    );

});
app.get("/usuarios-soporte",(req,res)=>{

    conexion.query(
        `
        SELECT
            id,
            nombre,
            rol
        FROM usuarios
        WHERE rol<>'soporte'
        ORDER BY nombre
        `,
        (err,resultados)=>{

            if(err){

                console.log(err);

                return res.status(500).json([]);

            }

            res.json(resultados);

        }
    );

});
app.get("/usuario-soporte/:id",(req,res)=>{

    conexion.query(
        `
        SELECT
            id,
            nombre,
            rol
        FROM usuarios
        WHERE id=?
        `,
        [req.params.id],
        (err,resultados)=>{

            if(err){

                console.log(err);

                return res.status(500).json({});

            }

            res.json(resultados[0]);

        }

    );

});
app.put("/habilitar-edicion-perfil/:usuario_id", (req, res) => {

    conexion.query(
        `
        UPDATE perfiles
        SET puede_editar = 1
        WHERE usuario_id = ?
        `,
        [req.params.usuario_id],
        (err, resultado) => {

            if(err){

                console.error(err);

                return res.status(500).json({
                    ok:false
                });

            }

            res.json({
                ok:true,
                mensaje:"El alumno ya puede editar nuevamente su perfil."
            });

        }

    );

});