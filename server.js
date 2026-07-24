const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const app = express();
const fs = require("fs");

app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/proyect"));
app.use("/css", express.static(__dirname + "/proyect/css"));
app.use("/img", express.static(__dirname + "/proyect/img"));

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

function verificarCarpetaRespaldos() {

    const carpeta = path.join(__dirname, "Respaldos");

    if (!fs.existsSync(carpeta)) {

        fs.mkdirSync(carpeta);

        console.log("📁 Carpeta Respaldos creada.");

    }

}
function obtenerFechaRespaldo() {

    const ahora = new Date();

    const dia = String(ahora.getDate()).padStart(2, "0");
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const anio = ahora.getFullYear();

    const hora = String(ahora.getHours()).padStart(2, "0");
    const minutos = String(ahora.getMinutes()).padStart(2, "0");

    return `${dia}-${mes}-${anio}_${hora}-${minutos}`;

}
function crearCarpetaRespaldo() {

    const nombreCarpeta =
        "Respaldo_" + obtenerFechaRespaldo();

    const ruta =
        path.join(
            __dirname,
            "Respaldos",
            nombreCarpeta
        );

    if (!fs.existsSync(ruta)) {

        fs.mkdirSync(ruta);

    }

    return ruta;

}
function respaldarTabla(nombreTabla, rutaRespaldo, callback) {

    conexion.query(

        `SELECT * FROM ${nombreTabla}`,

        (err, datos) => {

            if (err) {

                console.error(`❌ Error leyendo ${nombreTabla}:`, err);

                return callback(err);

            }

            const archivo = path.join(

                rutaRespaldo,

                `${nombreTabla}.json`

            );

            fs.writeFile(

                archivo,

                JSON.stringify(datos, null, 4),

                "utf8",

                (err) => {

                    if (err) {

                        console.error(`❌ Error guardando ${nombreTabla}:`, err);

                        return callback(err);

                    }

                    console.log(`✅ ${nombreTabla}.json respaldado.`);

                    callback(null);

                }

            );

        }

    );

}
function respaldarTodo(callback){

    const ruta = crearCarpetaRespaldo();

    const tablas = [

        "usuarios",
        "perfiles",
        "perfil_docente",
        "perfiles_alumnos",
        "materias",
        "docente_materias",
        "cursos",
        "horarios",
        "notas",
        "conductas",
        "asistencias",
        "fecha_inicio_docente",
        "foro",
        "respuestas_foro",
        "quizzes",
        "preguntas_quiz",
        "resultados_quiz",
        "tickets_soporte",
        "autorizaciones",
        "control_academico"

    ];

    let indice = 0;

    function siguiente(){

        if(indice >= tablas.length){

            console.log("🎉 Respaldo completo.");

            return callback(ruta);

        }

        respaldarTabla(

            tablas[indice],

            ruta,

            (err)=>{

                if(err){

                    return callback(null);

                }

                indice++;

                siguiente();

            }

        );

    }

    siguiente();

}
function borrarSistema(callback){

    console.log("================================");
    console.log("🗑 Iniciando limpieza del sistema...");
    console.log("================================");

    conexion.query(

        "SET FOREIGN_KEY_CHECKS = 0",

        (err)=>{

            if (err) {

                console.error("❌ Error desactivando FOREIGN_KEY_CHECKS:", err);

                return callback(false);

            }

            console.log("✅ FOREIGN_KEY_CHECKS desactivado.");

            const tablas = [

                "resultados_quiz",
                "preguntas_quiz",
                "notas",
                "asistencias",
                "perfil_docente",
                "perfiles_alumnos",
                "perfiles",
                "docente_materias",
                "horarios",
                "respuestas_foro",
                "foro",
                "quizzes",
                "conductas",
                "tickets_soporte",
                "fecha_inicio_docente",
                "autorizaciones"

            ];

            let indice = 0;

            function truncarSiguiente(){

                if(indice >= tablas.length){

                    console.log("✅ Todas las tablas fueron vaciadas.");

                    return truncarUsuarios(callback);

                }

                const tabla = tablas[indice];

                console.log("🗑 Vaciando:", tabla);

                conexion.query(

                    `TRUNCATE TABLE ${tabla}`,

                    (err)=>{

                        if (err) {

                            console.error(`❌ Error vaciando ${tabla}:`, err);

                            return callback(false);

                        }

                        console.log(`✅ ${tabla} vaciada.`);

                        indice++;

                        truncarSiguiente();

                    }

                );

            }

            truncarSiguiente();

        }

    );

}
function truncarUsuarios(callback){

    console.log("🗑 Vaciando usuarios...");

    conexion.query(

        "TRUNCATE TABLE usuarios",

        (err)=>{

            if(err){

                console.error("❌ Error vaciando usuarios:", err);

                return callback(false);

            }

            console.log("✅ Usuarios eliminados.");

            crearUsuarioSoporte((ok)=>{

                if(!ok){

                    return callback(false);

                }

                console.log("⚙ Reiniciando control académico...");

                conexion.query(

                    `
                    UPDATE control_academico
                    SET
                        notas_bloqueadas = 0,
                        conducta_bloqueada = 0,
                        fecha_cierre_notas = NULL,
                        fecha_cierre_conducta = NULL,
                        cierre_notas_ejecutado = 0,
                        cierre_conducta_ejecutado = 0
                    WHERE id = 1
                    `,

                    (err)=>{

                        if(err){

                            console.error("❌ Error reiniciando control académico:", err);

                            return callback(false);

                        }

                        console.log("✅ Control académico reiniciado.");

                        console.log("🗑 Limpiando configuración...");

                        conexion.query(

                            "DELETE FROM configuracion",

                            (err)=>{

                                if(err){

                                    console.error("❌ Error limpiando configuración:", err);

                                    return callback(false);

                                }

                                console.log("✅ Configuración limpiada.");

                                conexion.query(

                                    "SET FOREIGN_KEY_CHECKS = 1",

                                    (err)=>{

                                        if(err){

                                            console.error("❌ Error activando FOREIGN_KEY_CHECKS:", err);

                                            return callback(false);

                                        }

                                        console.log("✅ FOREIGN_KEY_CHECKS activado nuevamente.");

                                        return callback(true);

                                    }

                                );

                            }

                        );

                    }

                );

            });

        }

    );

}
function crearUsuarioSoporte(callback){

    conexion.query(

        `
        INSERT INTO usuarios
        (nombre,password,rol)
        VALUES
        ('soporte','Soporte2026','soporte')
        `,

        (err)=>{

            if(err){

                console.error("❌ Error creando el usuario soporte:", err);

                callback(false);

                return;

            }

            console.log("✅ Usuario soporte creado.");

            callback(true);

        }

    );

}


conexion.connect((error) => {

    if (error) {

        console.log("Error de conexión:", error);

    } else {

        console.log("Conectado a MySQL");

        verificarCarpetaRespaldos();

    }

});
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/proyect/index.html");
});
// Ruta que permite registrar un nuevo usuario
app.post("/registrar", (req, res) => {
    const { nombre, password, rol, curso, especialidad, materias } = req.body;
    console.log("================================");
    console.log("ROL:", rol);
    console.log("MATERIAS:", materias);
    console.log("================================");
    console.log("📝 Registrando usuario:", { nombre, rol, curso, especialidad });

    conexion.query(
        "SELECT id FROM usuarios WHERE nombre = ?",
        [nombre],
        (err, resultado) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    mensaje: "Error al verificar usuario"
                });
            }

            if (resultado.length > 0) {
                return res.status(400).json({
                    mensaje: "El nombre de usuario ya existe"
                });
            }

            const sql = `
                INSERT INTO usuarios
                (nombre, password, rol, estado_materias)
                VALUES (?, ?, ?, ?)
            `;

            const estado =
                rol === "docente"
                ? "pendiente"
                : null;

            conexion.query(
                sql,
                [nombre, password, rol, estado],
                (error, resultado) => {

                    if (error) {
                        console.error(error);
                        return res.status(500).json({
                            mensaje: "Error al registrar"
                        });
                    }

                    const userId = resultado.insertId;

                    // ==========================
                    // DOCENTE
                    // ==========================

                    if (rol === "docente") {

                        if (!materias || materias.length === 0) {

                            return res.json({
                                mensaje:"Docente registrado correctamente"
                            });

                        }

                        conexion.query(
                            "SELECT id,nombre FROM materias WHERE nombre IN (?)",
                            [materias],
                            (errMaterias, materiasDB) => {

                                if (errMaterias) {

                                    console.error(errMaterias);

                                    return res.status(500).json({
                                        mensaje:"Error obteniendo materias"
                                    });

                                }

                                const valores =
                                    materiasDB.map(m => [
                                        userId,
                                        m.id
                                    ]);

                                conexion.query(
                                    "INSERT INTO docente_materias (docente_id,materia_id) VALUES ?",
                                    [valores],
                                    (errInsert) => {

                                        if (errInsert) {

                                            console.error(errInsert);

                                            return res.status(500).json({
                                                mensaje:"Error guardando materias"
                                            });

                                        }

                                        res.json({
                                            mensaje:"Docente registrado correctamente"
                                        });

                                    }
                                );

                            }
                        );

                        return;
                    }

                    // ==========================
                    // ALUMNO
                    // ==========================

                    if (rol === "alumno") {

                        conexion.query(
                            `INSERT INTO perfiles
                            (usuario_id,nombre,curso,especialidad,estado_asignacion)
                            VALUES (?,?,?,?, 'pendiente')`,
                            [
                                userId,
                                nombre,
                                curso,
                                especialidad
                            ],
                            (errPerfil)=>{

                                if(errPerfil){

                                    console.error(errPerfil);

                                    return res.status(500).json({
                                        mensaje:"Error creando perfil"
                                    });

                                }

                                res.json({
                                    mensaje:"Alumno registrado correctamente"
                                });

                            }
                        );

                        return;
                    }

                    res.json({
                        mensaje:`${rol} registrado correctamente`
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

            if (error) {

                console.error(error);

                return res.status(500).json({
                    encontrado: false
                });

            }

            if (resultados.length > 0) {

                return res.json({

                    encontrado: true,

                    usuario: {

                        id: resultados[0].id,
                        nombre: resultados[0].nombre,
                        rol: resultados[0].rol

                    }

                });

            }

            return res.json({

                encontrado: false

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

    conexion.query(

        "SELECT id FROM perfil_docente WHERE usuario_id = ? LIMIT 1",

        [usuario_id],

        (err, resultado) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    ok: false
                });

            }

            // ===== SI YA EXISTE EL PERFIL =====

            if (resultado.length > 0) {

                conexion.query(

                    `
                    UPDATE perfil_docente
                    SET
                        titulo = ?,
                        materia = ?,
                        correo = ?,
                        telefono = ?,
                        experiencia = ?,
                        frase = ?,
                        presentacion = ?,
                        formacion = ?,
                        foto = ?,
                        perfil_bloqueado = 1
                    WHERE usuario_id = ?
                    `,

                    [
                        titulo,
                        materia,
                        correo,
                        telefono,
                        experiencia,
                        frase,
                        presentacion,
                        formacion,
                        foto,
                        usuario_id
                    ],

                    (err2) => {

                        if (err2) {

                            console.error(err2);

                            return res.status(500).json({
                                ok: false
                            });

                        }

                        res.json({
                            ok: true
                        });

                    }

                );

            }

            // ===== SI NO EXISTE =====

            else {

                conexion.query(

                    `
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
                        foto,
                        perfil_bloqueado
                    )
                    VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    `,

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

                    (err3) => {

                        if (err3) {

                            console.error(err3);

                            return res.status(500).json({
                                ok: false
                            });

                        }

                        res.json({
                            ok: true
                        });

                    }

                );

            }

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
        SELECT
            id_curso,
            nivel,
            paralelo,
            especializacion
        FROM cursos
        ORDER BY
            FIELD(nivel, '8', '9', '10', '1BGU', '2BGU', '3BGU'),
            FIELD(especializacion, 'Ciencias', 'Informática', 'Contabilidad'),
            paralelo;
    `;

    conexion.query(sql, (error, results) => {
        if (error) {
            console.log("❌ Error en /paralelos:", error);
            return res.status(500).json([]);
        }

        console.log("✅ Paralelos encontrados:", results.length);
        res.json(results);
    });
});

app.get("/alumnos-carpetas", (req, res) => {

    const sql = `
        SELECT
            usuario_id,
            nombre,
            curso,
            paralelo,
            especialidad
        FROM perfiles
        WHERE estado_asignacion = 'asignado'
    `;

    conexion.query(sql, (err, resultados) => {

        if (err) {
            console.error(err);
            return res.status(500).json([]);
        }

        res.json(resultados);

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
            u.nombre,
            u.rol
        FROM perfiles p
        INNER JOIN usuarios u
            ON p.usuario_id = u.id
        WHERE p.estado_asignacion = 'pendiente'
        AND u.rol = 'alumno'
    `;

    conexion.query(sql, (error, results) => {
        if (error) {
            console.log("❌ Error en /alumnos-pendientes:", error);
            return res.status(500).json([]);
        }

        console.log(`✅ ${results.length} alumnos pendientes encontrados`);
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
        docente,
        docente_id

    } = req.body;

    console.log("========== GUARDAR CONDUCTA ==========");
    console.log("Docente ID:", docente_id);
    console.log("Tipo docente:", typeof docente);
    console.log("Tipo docente_id:", typeof docente_id);
    console.log("Alumno:", alumno_usuario);
    console.log("Materia:", materia);

    conexion.query(

        `
        SELECT conducta_bloqueada
        FROM control_academico
        WHERE id = 1
        `,

        (err, control) => {

            if(err){

                console.error(err);

                return res.status(500).json({

                    error:"Error verificando control académico."

                });

            }

            const bloqueada = control[0].conducta_bloqueada;

            console.log("Estado conducta:", bloqueada);

            if(bloqueada == 1){

                console.log("La conducta está bloqueada. Verificando autorización...");

                console.log("Buscando autorización con:");
                console.log({
                    solicitado_por: docente_id,
                    accion: "desbloquear_conducta"
                });

                conexion.query(

                    `
                    SELECT *

                    FROM autorizaciones

                    WHERE solicitado_por = ?

                    AND accion = 'desbloquear_conducta'

                    AND estado = 'aprobado'

                    AND fecha_expiracion > NOW()
                    `,

                    [docente_id],

                    (err, permiso)=>{

                        if(err){

                            console.error(err);

                            return res.status(500).json({

                                error:"Error verificando autorización."

                            });

                        }
                
                        console.log("Permisos encontrados:", permiso.length);

                        if(permiso.length === 0){

                            console.log("❌ El docente NO tiene autorización.");
                            console.log("Docente buscado:", docente_id);

                            return res.status(403).json({

                                error:"🔒 La conducta está bloqueada por Rectoría."

                            });

                        }

                        console.log("✅ Docente autorizado.");

                        guardarConducta();

                    }

                );

            }else{

                console.log("✅ La conducta NO está bloqueada.");

                guardarConducta();

            }

        }

    );

    function guardarConducta(){

        conexion.query(

            `
            SELECT id

            FROM conductas

            WHERE alumno_usuario = ?

            AND materia = ?
            `,

            [

                alumno_usuario,
                materia

            ],

            (err, resultados)=>{

                if(err){

                    console.error(err);

                    return res.status(500).json({

                        error:err.message

                    });

                }

                if(resultados.length > 0){

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

                        (err)=>{

                            if(err){

                                console.error(err);

                                return res.status(500).json({

                                    error:err.message

                                });

                            }

                            console.log("✅ Conducta actualizada.");

                            res.json({

                                mensaje:"Conducta actualizada"

                            });

                        }

                    );

                }else{

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

                        VALUES (?,?,?,?,?,?,?,?)
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

                        (err)=>{

                            if(err){

                                console.error(err);

                                return res.status(500).json({

                                    error:err.message

                                });

                            }

                            console.log("✅ Conducta guardada.");

                            res.json({

                                mensaje:"Conducta guardada"

                            });

                        }

                    );

                }

            }

        );

    }

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

    console.log("========== GUARDAR NOTA ==========");
    console.log("Docente:", docente_id);
    console.log("Alumno:", alumno_id);
    console.log("Materia:", materia_id);

    // Verificar si las notas están bloqueadas
    conexion.query(

        `
        SELECT notas_bloqueadas
        FROM control_academico
        WHERE id = 1
        `,

        (err, control) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    error: "Error verificando control académico."

                });

            }

            const bloqueadas = control[0].notas_bloqueadas;

            console.log("Estado notas:", bloqueadas);

            // Si están bloqueadas, verificar autorización
            if (bloqueadas == 1) {

                console.log("Las notas están bloqueadas. Verificando autorización...");

                conexion.query(

                    `
                    SELECT *

                    FROM autorizaciones

                    WHERE solicitado_por = ?

                    AND accion = 'desbloquear_notas'

                    AND estado = 'aprobado'

                    AND fecha_expiracion > NOW()
                    `,

                    [docente_id],

                    (err, permiso) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({

                                error: "Error verificando autorización."

                            });

                        }

                        console.log("Permisos encontrados:", permiso.length);
                        console.log("Docente recibido:", docente_id);
                        console.table(permiso);

                        if (permiso.length === 0) {

                            console.log("❌ El docente NO tiene autorización.");

                            return res.status(403).json({

                                error: "🔒 Las notas están bloqueadas por Rectoría."

                            });

                        }

                        console.log("✅ Docente autorizado.");

                        guardarNota();

                    }

                );

            } else {

                console.log("✅ Las notas NO están bloqueadas.");

                guardarNota();

            }

        }

    );

    // ==========================
    // FUNCIÓN PARA GUARDAR NOTA
    // ==========================

    function guardarNota() {

        console.log("Entrando a guardarNota()");

        conexion.query(

            `
            SELECT id

            FROM notas

            WHERE alumno_id = ?

            AND docente_id = ?

            AND materia_id = ?
            `,

            [

                alumno_id,
                docente_id,
                materia_id

            ],

            (err, resultado) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({

                        error: err.message

                    });

                }

                if (resultado.length > 0) {

                    console.log("Actualizando nota existente ID:", resultado[0].id);

                    conexion.query(

                        `
                        UPDATE notas

                        SET

                            p1 = ?,
                            p2 = ?,
                            examen = ?,
                            promedio = ?

                        WHERE id = ?
                        `,

                        [

                            p1,
                            p2,
                            examen,
                            promedio,
                            resultado[0].id

                        ],

                        (err) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({

                                    error: err.message

                                });

                            }

                            console.log("✅ Nota actualizada.");

                            res.json({

                                mensaje: "Nota actualizada"

                            });

                        }

                    );

                } else {

                    console.log("Insertando nueva nota.");

                    conexion.query(

                        `
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

                        VALUES (?,?,?,?,?,?,?)
                        `,

                        [

                            alumno_id,
                            docente_id,
                            materia_id,
                            p1,
                            p2,
                            examen,
                            promedio

                        ],

                        (err) => {

                            if (err) {

                                console.error(err);

                                return res.status(500).json({

                                    error: err.message

                                });

                            }

                            console.log("✅ Nota guardada.");

                            res.json({

                                mensaje: "Nota guardada"

                            });

                        }

                    );

                }

            }

        );

    }

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
        "SELECT * FROM foro WHERE visible = 1 ORDER BY id DESC",
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
app.get("/perfiles", (req,res)=>{

    conexion.query(

        `
        SELECT *
        FROM perfiles
        WHERE estado_asignacion='asignado'
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
app.post("/guardar-asistencia", (req, res) => {

    const {

        alumno_id,
        docente_id,
        fecha,
        estado

    } = req.body;

    conexion.query(

        `
        INSERT INTO asistencias
        (
            alumno_id,
            docente_id,
            fecha,
            estado
        )
        VALUES (?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE

            estado = VALUES(estado)
        `,

        [

            alumno_id,
            docente_id,
            fecha,
            estado

        ],

        (err) => {

            if(err){

                console.error(err);

                return res.status(500).json({

                    error:"Error guardando asistencia"

                });

            }

            res.json({

                mensaje:"Asistencia guardada"

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

app.post("/asignar-materia", (req, res) => {
    const { docenteId, materiaId, materiaNombre } = req.body;

    console.log("📌 Intentando asignar:", { docenteId, materiaId, materiaNombre });

    const dbConexion = typeof db !== "undefined" ? db 
                     : typeof conexion !== "undefined" ? conexion 
                     : typeof connection !== "undefined" ? connection 
                     : null;

    if (!dbConexion) {
        return res.status(500).json({ ok: false, mensaje: "Sin conexión a DB" });
    }

    // Intentamos actualizar el estado del docente o insertar la asignación
    const sqlInsert = "INSERT INTO docentes_asignados (docente_id, materia_id) VALUES (?, ?)";

    dbConexion.query(sqlInsert, [docenteId, materiaId], (err) => {
        if (err) {
            console.error("❌ Detalle del error MySQL:", err.sqlMessage || err.message);
            
            // Si la columna falla, probamos con la estructura alternativa habitual
            const sqlAlt = "INSERT INTO docente_materias (docente_id, materia_id) VALUES (?, ?)";
            dbConexion.query(sqlAlt, [docenteId, materiaId], (errAlt) => {
                if (errAlt) {
                    console.error("❌ Falló también alternativa:", errAlt.sqlMessage || errAlt.message);
                    return res.status(400).json({ ok: false, mensaje: err.sqlMessage || err.message });
                }
                return res.json({ ok: true, mensaje: "Materia asignada correctamente" });
            });
            return;
        }

        console.log("✅ Asignación guardada con éxito");
        res.json({ ok: true, mensaje: "Materia asignada correctamente" });
    });
});

app.post("/editar-materia", (req, res) => {
    const { id, materia_id } = req.body;

    console.log(`📌 Intentando actualizar asignación ID: ${id} a materia_id: ${materia_id}`);

    if (!id || !materia_id) {
        return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    const sql = "UPDATE docentes_asignados SET materia_id = ? WHERE id = ?";

    const dbConexion = typeof db !== "undefined" ? db 
                     : typeof conexion !== "undefined" ? conexion 
                     : typeof connection !== "undefined" ? connection 
                     : null;

    if (!dbConexion) {
        return res.status(500).json({ success: false, message: "Sin conexión a BD" });
    }

    dbConexion.query(sql, [materia_id, id], (err, result) => {
        if (err) {
            console.error("❌ Error SQL al editar materia:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }

        console.log(`✅ Filas modificadas: ${result.affectedRows}`);
        res.json({ success: true, message: "Materia actualizada con éxito" });
    });
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
app.post("/guardar-fecha-inicio", (req, res) => {

    console.log("Body recibido:", req.body);

    const {

        docente_id,
        fechaInicio,
        curso,
        paralelo,
        especialidad

    } = req.body;

    conexion.query(

        `
        INSERT INTO fecha_inicio_docente
        (

            docente_id,
            fecha_inicio,
            curso,
            paralelo,
            especialidad

        )

        VALUES (?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE

            fecha_inicio = VALUES(fecha_inicio),
            curso = VALUES(curso),
            paralelo = VALUES(paralelo),
            especialidad = VALUES(especialidad)
        `,

        [

            docente_id,
            fechaInicio,
            curso,
            paralelo,
            especialidad

        ],

        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    ok: false
                });

            }

            res.json({
                ok: true
            });

        }

    );

});

app.get("/solicitudes-docentes", (req, res) => {
    // Consulta para traer las solicitudes de los docentes que aún NO han sido asignados
    const sql = `
        SELECT 
            u.id, 
            u.nombre, 
            GROUP_CONCAT(DISTINCT m.nombre SEPARATOR ', ') AS materias,
            GROUP_CONCAT(DISTINCT m.id SEPARATOR ', ') AS materias_ids
        FROM usuarios u
        LEFT JOIN solicitudes s ON u.id = s.docente_id
        LEFT JOIN materias m ON s.materia_id = m.id
        WHERE u.rol = 'docente' 
          AND u.id NOT IN (SELECT docente_id FROM docentes_asignados WHERE docente_id IS NOT NULL)
        GROUP BY u.id
    `;

    const dbConexion = typeof db !== "undefined" ? db 
                     : typeof conexion !== "undefined" ? conexion 
                     : typeof connection !== "undefined" ? connection 
                     : null;

    if (!dbConexion) {
        return res.status(200).json([]); // Evitamos el error 500 devolviendo array vacío
    }

    dbConexion.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error SQL en solicitudes-docentes:", err.message);
            
            // RESPALDO DE SEGURIDAD: Si la consulta con JOINs falla, probamos traer directo de usuarios
            const sqlFallback = "SELECT id, nombre FROM usuarios WHERE rol = 'docente'";
            dbConexion.query(sqlFallback, (err2, fallbackResults) => {
                if (err2) return res.status(200).json([]);
                return res.json(fallbackResults || []);
            });
            return;
        }

        res.json(results || []);
    });
});

app.get("/docentes-asignados", (req, res) => {

    const sql = `
        SELECT
            da.id,
            da.docente_id,
            da.materia_id,
            u.nombre,
            m.nombre AS materia_nombre
        FROM docentes_asignados da
        INNER JOIN usuarios u
            ON da.docente_id = u.id
        INNER JOIN materias m
            ON da.materia_id = m.id
        WHERE u.rol='docente'
        ORDER BY u.nombre
    `;

    conexion.query(sql, (err, resultados) => {

        if(err){
            console.error(err);
            return res.status(500).json([]);
        }

        console.log("DOCENTES:", resultados);

        res.json(resultados);

    });

});

app.get("/datos-docente/:id", (req,res)=>{

    const id = req.params.id;

    conexion.query(
        `
        SELECT
            u.nombre,
            m.nombre AS materia
        FROM usuarios u

        LEFT JOIN docentes_asignados da
            ON u.id = da.docente_id

        LEFT JOIN materias m
            ON da.materia_id = m.id

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

            if(resultados.length===0){

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
            p.*,
            m.nombre AS materia

        FROM usuarios u

        INNER JOIN perfil_docente p
            ON u.id = p.usuario_id

        LEFT JOIN docentes_asignados da
            ON da.docente_id = u.id

        LEFT JOIN materias m
            ON da.materia_id = m.id

        WHERE u.id = ?

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

            if(resultados.length===0){

                return res.json({
                    ok:false
                });

            }

            resultados[0].materia =
                resultados[0].materia || "Sin asignar";

            res.json({
                ok:true,
                perfil: resultados[0]
            });

        }
    );

});

app.get("/materia-docente/:id", (req, res) => {
    const id = req.params.id;

    conexion.query(
        `
        SELECT 
            dm.materia_id,
            m.nombre AS materia
        FROM docente_materias dm
        INNER JOIN materias m ON dm.materia_id = m.id
        WHERE dm.docente_id = ?
        LIMIT 1
        `,
        [id],
        (err, resultados) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    ok: false,
                    error: err.message
                });
            }

            if (resultados.length === 0) {
                return res.json({
                    ok: true,
                    materia_id: null,
                    materia: null
                });
            }

            res.json({
                ok: true,
                materia_id: resultados[0].materia_id,
                materia: resultados[0].materia
            });
        }
    );
});

app.post("/eliminar-docente", (req, res) => {
    const { id } = req.body;

    // Paso 1: Eliminar de la tabla horarios para no romper la Clave Foránea (FK)
    conexion.query(
        "DELETE FROM horarios WHERE id_docente = ?",
        [id],
        (err) => {
            if (err) {
                console.error("Error en horarios:", err);
                return res.status(500).json({ error: "Error eliminando horarios del docente" });
            }

            // Paso 2: Eliminar las relaciones de materias
            conexion.query(
                "DELETE FROM docente_materias WHERE docente_id = ?",
                [id],
                (err2) => {
                    if (err2) {
                        console.error("Error en docente_materias:", err2);
                        return res.status(500).json({ error: "Error eliminando materias" });
                    }

                    // Paso 3: Borrar al usuario de la tabla usuarios
                    conexion.query(
                        "DELETE FROM usuarios WHERE id = ?",
                        [id],
                        (err3) => {
                            if (err3) {
                                console.error("Error en usuarios:", err3);
                                return res.status(500).json({ error: "Error eliminando docente" });
                            }

                            res.json({ success: true, mensaje: "Docente y registros asociados eliminados con éxito" });
                        }
                    );
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

app.get("/quizzes", (req, res) => {
    conexion.query(
        `
        SELECT
            q.id,
            q.titulo,
            m.nombre AS materia
        FROM quizzes q
        JOIN materias m ON q.materia_id = m.id
        WHERE q.visible = 1
        `,
        (err, resultados) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }
            res.json(resultados);
        }
    );
});

app.get("/quizzes/:id", (req,res)=>{
    const id = req.params.id;
    conexion.query(
        "SELECT * FROM quizzes WHERE id = ? AND visible = 1",
        [id],
        (err,quiz)=>{
            if(err){
                return res.status(500).json(err);
            }
            if(quiz.length === 0){
                return res.status(404).json({
                    mensaje: "Quiz no encontrado o no disponible"
                });
            }
            conexion.query(
                "SELECT * FROM preguntas_quiz WHERE quiz_id = ?",
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
app.get("/materias-docente/:id", (req, res) => {

    const docenteId = req.params.id;

    const sql = `
        SELECT DISTINCT
            da.materia_id AS id,
            m.nombre
        FROM docentes_asignados da
        INNER JOIN materias m
            ON da.materia_id = m.id
        WHERE da.docente_id = ?
        ORDER BY m.nombre
    `;

    conexion.query(sql, [docenteId], (err, resultados) => {

        if (err) {

            console.error(err);

            return res.json({
                ok: false,
                materias: []
            });

        }

        res.json({
            ok: true,
            materias: resultados
        });

    });

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


// ============================================
// 🔐 VERIFICAR SI ES CONTRASEÑA TEMPORAL
// ============================================
app.post("/verificar-contrasena-temporal", (req, res) => {
    const { usuario_id } = req.body;

    conexion.query(
        'SELECT password FROM usuarios WHERE id = ?',
        [usuario_id],
        (error, resultados) => {
            if (error) {
                console.error(error);
                return res.status(500).json({
                    esTemporal: false,
                    mensaje: "Error al verificar"
                });
            }

            if (resultados.length === 0) {
                return res.json({
                    esTemporal: false,
                    mensaje: "Usuario no encontrado"
                });
            }

            // Verificar si la contraseña es la temporal (12345678)
            const esTemporal = resultados[0].password === "12345678";
            
            console.log(`🔐 Usuario ID ${usuario_id}: ${esTemporal ? 'Contraseña temporal' : 'Contraseña segura'}`);
            
            res.json({
                esTemporal: esTemporal,
                mensaje: esTemporal ? "Debe cambiar su contraseña" : "Contraseña segura"
            });
        }
    );
});

// ============================================
// 🔑 CAMBIAR CONTRASEÑA (Para el usuario)
// ============================================
app.put("/cambiar-contrasena", (req, res) => {
    const { usuario_id, nueva_contrasena } = req.body;

    // Validar que la nueva contraseña no esté vacía y tenga al menos 4 caracteres
    if (!nueva_contrasena || nueva_contrasena.trim().length < 4) {
        return res.status(400).json({
            ok: false,
            mensaje: "La contraseña debe tener al menos 4 caracteres"
        });
    }

    // Verificar que la nueva contraseña no sea la temporal
    if (nueva_contrasena === "12345678") {
        return res.status(400).json({
            ok: false,
            mensaje: "No puedes usar la contraseña temporal. Elige una contraseña diferente."
        });
    }

    // Obtener el nombre del usuario para mostrar en el mensaje
    conexion.query(
        'SELECT nombre FROM usuarios WHERE id = ?',
        [usuario_id],
        (error, usuario) => {
            if (error) {
                console.error("❌ Error al buscar usuario:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al buscar usuario"
                });
            }

            if (usuario.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Usuario no encontrado"
                });
            }

            // Actualizar la contraseña
            conexion.query(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nueva_contrasena, usuario_id],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al cambiar contraseña:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al cambiar la contraseña: " + err.message
                        });
                    }

                    if (resultado.affectedRows > 0) {
                        console.log(`✅ Contraseña cambiada para: ${usuario[0].nombre}`);
                        res.json({
                            ok: true,
                            mensaje: `✅ Contraseña actualizada correctamente para ${usuario[0].nombre}`,
                            usuario: usuario[0].nombre
                        });
                    } else {
                        res.json({
                            ok: false,
                            mensaje: "No se pudo actualizar la contraseña"
                        });
                    }
                }
            );
        }
    );
});

// ============================================
// 🔑 ENDPOINT PARA RESTABLECER CONTRASEÑA (Soporte)
// ============================================
app.put('/restablecer-contrasena/:id', (req, res) => {
    console.log("📩 ===== SOLICITUD DE RESTABLECER CONTRASEÑA =====");
    console.log("📩 ID recibido:", req.params.id);
    
    const { id } = req.params;
    const { nueva_contrasena } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({
            ok: false,
            mensaje: "ID de usuario inválido"
        });
    }

    if (!nueva_contrasena || nueva_contrasena.trim() === '') {
        return res.status(400).json({
            ok: false,
            mensaje: "La contraseña no puede estar vacía"
        });
    }

    conexion.query(
        'SELECT id, nombre FROM usuarios WHERE id = ?',
        [id],
        (error, usuario) => {
            if (error) {
                console.error("❌ Error al buscar usuario:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al buscar usuario: " + error.message
                });
            }

            if (!usuario || usuario.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Usuario no encontrado"
                });
            }

            console.log(`👤 Usuario encontrado: ${usuario[0].nombre}`);

            conexion.query(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nueva_contrasena, id],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al actualizar contraseña:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al actualizar contraseña: " + err.message
                        });
                    }

                    if (resultado.affectedRows > 0) {
                        console.log(`✅ Contraseña restablecida para: ${usuario[0].nombre}`);
                        res.json({
                            ok: true,
                            mensaje: `✅ Contraseña restablecida para ${usuario[0].nombre}`,
                            usuario: usuario[0].nombre
                        });
                    } else {
                        res.json({
                            ok: false,
                            mensaje: "No se pudo actualizar la contraseña"
                        });
                    }
                }
            );
        }
    );
});

//Respaldo
app.post("/restablecer-sistema", (req, res) => {

    console.log("====================================");
    console.log("🔄 Iniciando restablecimiento...");
    console.log("====================================");

    respaldarTodo((ruta)=>{

        if(!ruta){

            return res.status(500).json({

                ok:false,
                mensaje:"Error creando el respaldo."

            });

        }

        console.log("✅ Respaldo terminado.");
        console.log("📂", ruta);

        borrarSistema((ok)=>{

            if(!ok){

                return res.status(500).json({

                    ok:false,
                    mensaje:"Error durante el restablecimiento del sistema."

                });

            }

            console.log("====================================");
            console.log("🎉 Sistema restablecido correctamente.");
            console.log("====================================");

            res.json({

                ok:true,
                mensaje:"Sistema restablecido correctamente.",
                ruta:ruta

            });

        });

    });

});
app.post("/crear-respaldo", (req, res) => {

    console.log("====================================");
    console.log("💾 Creando respaldo...");
    console.log("====================================");

    respaldarTodo((ruta) => {

        if (!ruta) {

            return res.status(500).json({

                ok: false,
                mensaje: "No fue posible crear el respaldo."

            });

        }

        console.log("✅ Respaldo creado.");
        console.log("📂", ruta);

        res.json({

            ok: true,
            mensaje: "Respaldo creado correctamente.",
            ruta: ruta

        });

    });

});
app.get("/respaldos", (req, res) => {

    const carpeta = path.join(__dirname, "Respaldos");

    if (!fs.existsSync(carpeta)) {

        return res.json([]);

    }

    fs.readdir(carpeta, (err, carpetas) => {

        if (err) {

            return res.status(500).json({
                error: "No fue posible leer los respaldos."
            });

        }

        const respaldos = carpetas.map(nombre => {

            const ruta = path.join(carpeta, nombre);

            const info = fs.statSync(ruta);

            let tamañoTotal = 0;

            const archivos = fs.readdirSync(ruta);

            archivos.forEach(archivo => {

                const rutaArchivo = path.join(ruta, archivo);

                const infoArchivo = fs.statSync(rutaArchivo);

                if (infoArchivo.isFile()) {

                    tamañoTotal += infoArchivo.size;

                }

            });

            return {

                nombre,

                fecha: info.mtime,

                tamaño: (tamañoTotal / 1024).toFixed(2) + " KB"

            };

        });

        respaldos.sort((a, b) =>
            new Date(b.fecha) - new Date(a.fecha)
        );

        res.json(respaldos);

    });

});
app.get("/respaldos/:nombre", (req, res) => {

    const nombre = req.params.nombre;

    const ruta = path.join(__dirname, "Respaldos", nombre);

    if (!fs.existsSync(ruta)) {

        return res.status(404).json({
            error: "El respaldo no existe."
        });

    }

    const archivos = fs.readdirSync(ruta);

    const lista = archivos.map(archivo => {

        const rutaArchivo = path.join(ruta, archivo);

        const info = fs.statSync(rutaArchivo);

        return {

            nombre: archivo,

            tamaño: (info.size / 1024).toFixed(2) + " KB"

        };

    });

    res.json(lista);

});
app.get("/respaldos/:respaldo/:archivo", (req, res) => {

    const respaldo = req.params.respaldo;
    const archivo = req.params.archivo;

    const ruta = path.join(
        __dirname,
        "Respaldos",
        respaldo,
        archivo
    );

    if (!fs.existsSync(ruta)) {

        return res.status(404).json({
            error: "El archivo no existe."
        });

    }

    fs.readFile(ruta, "utf8", (err, contenido) => {

        if (err) {

            return res.status(500).json({
                error: "No fue posible leer el archivo."
            });

        }

        res.send(contenido);

    });

});
app.get("/descargar-respaldo/:respaldo/:archivo", (req, res) => {

    const respaldo = req.params.respaldo;
    const archivo = req.params.archivo;

    const ruta = path.join(
        __dirname,
        "Respaldos",
        respaldo,
        archivo
    );

    if (!fs.existsSync(ruta)) {

        return res.status(404).json({

            error: "Archivo no encontrado."

        });

    }

    res.download(ruta);

});

app.listen(3000, () => {

    console.log("Servidor ejecutándose en puerto 3000");

    setInterval(() => {

        conexion.query(

            `
            SELECT *
            FROM control_academico
            WHERE id = 1
            `,

            (err, resultado) => {

                if (err) {

                    console.error(err);
                    return;

                }

                const control = resultado[0];
                const ahora = new Date();

                //====================================
                // BLOQUEAR NOTAS
                //====================================

                if (

                    control.cierre_notas_ejecutado == 0 &&
                    control.fecha_cierre_notas &&
                    ahora >= new Date(control.fecha_cierre_notas)

                ) {

                    conexion.query(

                        `
                        UPDATE control_academico
                        SET
                            notas_bloqueadas = 1,
                            cierre_notas_ejecutado = 1,
                            fecha_cierre_notas = NULL
                        WHERE id = 1
                        `,

                        (err, updateResultado) => {

                            if (err) {

                                console.error("Error bloqueando notas:", err);
                                return;

                            }

                            if (updateResultado.affectedRows > 0) {

                                console.log("🔒 Notas bloqueadas automáticamente.");

                            }

                        }

                    );

                }

                //====================================
                // BLOQUEAR CONDUCTA
                //====================================

                if (

                    control.cierre_conducta_ejecutado == 0 &&
                    control.fecha_cierre_conducta &&
                    ahora >= new Date(control.fecha_cierre_conducta)

                ) {

                    conexion.query(

                        `
                        UPDATE control_academico
                        SET
                            conducta_bloqueada = 1,
                            cierre_conducta_ejecutado = 1,
                            fecha_cierre_conducta = NULL
                        WHERE id = 1
                        `,

                        (err, updateResultado) => {

                            if (err) {

                                console.error("Error bloqueando conducta:", err);
                                return;

                            }

                            if (updateResultado.affectedRows > 0) {

                                console.log("🔒 Conducta bloqueada automáticamente.");

                            }

                        }

                    );

                }

            }

        );

    }, 5000);

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

// ============================================
// 🔑 ENDPOINT PARA RESTABLECER CONTRASEÑA
// ============================================
app.put('/restablecer-contrasena/:id', (req, res) => {
    console.log("📩 ===== SOLICITUD DE RESTABLECER CONTRASEÑA =====");
    console.log("📩 ID recibido:", req.params.id);
    console.log("📩 Body recibido:", req.body);
    
    const { id } = req.params;
    const { nueva_contrasena } = req.body;

    // Validar que el ID sea válido
    if (!id || isNaN(id)) {
        console.log("❌ ID inválido:", id);
        return res.status(400).json({
            ok: false,
            mensaje: "ID de usuario inválido"
        });
    }

    // Validar que la nueva contraseña no esté vacía
    if (!nueva_contrasena || nueva_contrasena.trim() === '') {
        console.log("❌ Contraseña vacía");
        return res.status(400).json({
            ok: false,
            mensaje: "La contraseña no puede estar vacía"
        });
    }

    // Primero verificar si el usuario existe
    conexion.query(
        'SELECT id, nombre FROM usuarios WHERE id = ?',
        [id],
        (error, usuario) => {
            if (error) {
                console.error("❌ Error al buscar usuario:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al buscar usuario: " + error.message
                });
            }

            if (!usuario || usuario.length === 0) {
                console.log("❌ Usuario no encontrado");
                return res.status(404).json({
                    ok: false,
                    mensaje: "Usuario no encontrado"
                });
            }

            console.log(`👤 Usuario encontrado: ${usuario[0].nombre}`);

            // Actualizar la contraseña
            conexion.query(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [nueva_contrasena, id],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al actualizar contraseña:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al actualizar contraseña: " + err.message
                        });
                    }

                    console.log("📊 Resultado de la actualización:", resultado);

                    if (resultado.affectedRows > 0) {
                        console.log(`✅ Contraseña restablecida para: ${usuario[0].nombre}`);
                        res.json({
                            ok: true,
                            mensaje: `✅ Contraseña restablecida para ${usuario[0].nombre}`,
                            usuario: usuario[0].nombre
                        });
                    } else {
                        console.log("❌ No se actualizó ninguna fila");
                        res.json({
                            ok: false,
                            mensaje: "No se pudo actualizar la contraseña"
                        });
                    }
                }
            );
        }
    );
});

// ============================================
// ENDPOINTS PARA ADMINISTRAR DOCENTES (SOPORTE)
// ============================================

// 1. ACTUALIZAR USUARIO (Editar Perfil)
app.put("/actualizar-usuario-soporte/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, rol } = req.body;

    conexion.query(
        "UPDATE usuarios SET nombre = ?, rol = ? WHERE id = ?",
        [nombre, rol, id],
        (error, resultado) => {
            if (error) {
                console.error("❌ Error al actualizar usuario:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al actualizar: " + error.message
                });
            }

            if (resultado.affectedRows > 0) {
                res.json({
                    ok: true,
                    mensaje: "Usuario actualizado correctamente"
                });
            } else {
                res.json({
                    ok: false,
                    mensaje: "Usuario no encontrado"
                });
            }
        }
    );
});
app.put("/desbloquear-perfil-docente/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        UPDATE perfil_docente
        SET perfil_bloqueado = 0
        WHERE usuario_id = ?
    `;

    conexion.query(sql, [id], (error) => {

        if (error) {

            console.error(error);

            return res.json({
                ok: false
            });

        }

        res.json({
            ok: true
        });

    });

});


// 2. RESTABLECER FECHA INICIO DOCENTE
app.put("/restablecer-fecha-inicio/:docenteId", (req, res) => {

    const docenteId = req.params.docenteId;

    conexion.query(

        "DELETE FROM asistencias WHERE docente_id = ?",

        [docenteId],

        (error) => {

            if(error){

                console.error(error);

                return res.status(500).json({
                    ok:false,
                    mensaje:"Error eliminando las asistencias."
                });

            }

            conexion.query(

                "DELETE FROM fecha_inicio_docente WHERE docente_id = ?",

                [docenteId],

                (error2) => {

                    if(error2){

                        console.error(error2);

                        return res.status(500).json({
                            ok:false,
                            mensaje:"Error eliminando la fecha."
                        });

                    }

                    res.json({

                        ok:true,
                        mensaje:"Fecha restablecida correctamente."

                    });

                }

            );

        }

    );

});

// 3. REINICIAR NOTAS DEL DOCENTE
app.delete("/reiniciar-notas-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;

    // Primero obtener el conteo
    conexion.query(
        "SELECT COUNT(*) as total FROM notas WHERE docente_id = ?",
        [docenteId],
        (error, countResult) => {
            if (error) {
                console.error("❌ Error al contar notas:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al contar notas"
                });
            }

            const total = countResult[0].total;

            // Eliminar las notas
            conexion.query(
                "DELETE FROM notas WHERE docente_id = ?",
                [docenteId],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al eliminar notas:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al eliminar notas"
                        });
                    }

                    res.json({
                        ok: true,
                        eliminadas: total,
                        mensaje: `Se eliminaron ${total} notas`
                    });
                }
            );
        }
    );
});

// 4. REINICIAR CONDUCTA DEL DOCENTE
app.delete("/reiniciar-conducta-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;

    conexion.query(
        "SELECT COUNT(*) as total FROM conductas WHERE docente = (SELECT nombre FROM usuarios WHERE id = ?)",
        [docenteId],
        (error, countResult) => {
            if (error) {
                console.error("❌ Error al contar conductas:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al contar conductas"
                });
            }

            const total = countResult[0].total;

            conexion.query(
                "DELETE FROM conductas WHERE docente = (SELECT nombre FROM usuarios WHERE id = ?)",
                [docenteId],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al eliminar conductas:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al eliminar conductas"
                        });
                    }

                    res.json({
                        ok: true,
                        eliminadas: total,
                        mensaje: `Se eliminaron ${total} registros de conducta`
                    });
                }
            );
        }
    );
});

// 5. ELIMINAR FOROS DEL DOCENTE
app.delete("/eliminar-foros-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;

    // Obtener los IDs de los foros del docente
    conexion.query(
        "SELECT id FROM foro WHERE docente = (SELECT nombre FROM usuarios WHERE id = ?)",
        [docenteId],
        (error, foros) => {
            if (error) {
                console.error("❌ Error al obtener foros:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al obtener foros"
                });
            }

            const totalForos = foros.length;

            if (totalForos === 0) {
                return res.json({
                    ok: true,
                    eliminados: 0,
                    mensaje: "No hay foros para eliminar"
                });
            }

            // Eliminar respuestas de los foros
            const foroIds = foros.map(f => f.id);
            const placeholders = foroIds.map(() => '?').join(',');

            conexion.query(
                `DELETE FROM respuestas_foro WHERE foro_id IN (${placeholders})`,
                foroIds,
                (err) => {
                    if (err) {
                        console.error("❌ Error al eliminar respuestas:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al eliminar respuestas"
                        });
                    }

                    // Eliminar los foros
                    conexion.query(
                        `DELETE FROM foro WHERE id IN (${placeholders})`,
                        foroIds,
                        (err2) => {
                            if (err2) {
                                console.error("❌ Error al eliminar foros:", err2);
                                return res.status(500).json({
                                    ok: false,
                                    mensaje: "Error al eliminar foros"
                                });
                            }

                            res.json({
                                ok: true,
                                eliminados: totalForos,
                                mensaje: `Se eliminaron ${totalForos} foros y sus respuestas`
                            });
                        }
                    );
                }
            );
        }
    );
});

// ============================================
// ENDPOINTS PARA OCULTAR/MOSTRAR FOROS (SOPORTE)
// ============================================

// Ocultar todos los foros de un docente
app.put("/ocultar-foros-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;
    conexion.query(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [docenteId],
        (error, usuario) => {
            if (error || usuario.length === 0) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Docente no encontrado"
                });
            }
            const nombreDocente = usuario[0].nombre;
            conexion.query(
                "UPDATE foro SET visible = 0 WHERE docente = ?",
                [nombreDocente],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al ocultar foros:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al ocultar foros"
                        });
                    }
                    res.json({
                        ok: true,
                        ocultados: resultado.affectedRows,
                        mensaje: `Se ocultaron ${resultado.affectedRows} foros`
                    });
                }
            );
        }
    );
});

// Mostrar todos los foros de un docente
app.put("/mostrar-foros-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;
    conexion.query(
        "SELECT nombre FROM usuarios WHERE id = ?",
        [docenteId],
        (error, usuario) => {
            if (error || usuario.length === 0) {
                return res.status(500).json({
                    ok: false,
                    mensaje: "Docente no encontrado"
                });
            }
            const nombreDocente = usuario[0].nombre;
            conexion.query(
                "UPDATE foro SET visible = 1 WHERE docente = ?",
                [nombreDocente],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al mostrar foros:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al mostrar foros"
                        });
                    }
                    res.json({
                        ok: true,
                        mostrados: resultado.affectedRows,
                        mensaje: `Se mostraron ${resultado.affectedRows} foros`
                    });
                }
            );
        }
    );
});

// ============================================
// ENDPOINTS PARA OCULTAR/MOSTRAR QUIZZIZ (SOPORTE)
// ============================================

// Ocultar todos los Quizziz de un docente
app.put("/ocultar-quizziz-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;
    conexion.query(
        "SELECT id, nombre FROM usuarios WHERE id = ? AND rol = 'docente'",
        [docenteId],
        (error, usuario) => {
            if (error || usuario.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Docente no encontrado"
                });
            }
            conexion.query(
                "UPDATE quizzes SET visible = 0 WHERE docente_id = ?",
                [docenteId],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al ocultar Quizziz:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al ocultar Quizziz"
                        });
                    }
                    res.json({
                        ok: true,
                        ocultados: resultado.affectedRows,
                        mensaje: `Se ocultaron ${resultado.affectedRows} Quizziz`
                    });
                }
            );
        }
    );
});

// Mostrar todos los Quizziz de un docente
app.put("/mostrar-quizziz-docente/:docenteId", (req, res) => {
    const { docenteId } = req.params;
    conexion.query(
        "SELECT id, nombre FROM usuarios WHERE id = ? AND rol = 'docente'",
        [docenteId],
        (error, usuario) => {
            if (error || usuario.length === 0) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Docente no encontrado"
                });
            }
            conexion.query(
                "UPDATE quizzes SET visible = 1 WHERE docente_id = ?",
                [docenteId],
                (err, resultado) => {
                    if (err) {
                        console.error("❌ Error al mostrar Quizziz:", err);
                        return res.status(500).json({
                            ok: false,
                            mensaje: "Error al mostrar Quizziz"
                        });
                    }
                    res.json({
                        ok: true,
                        mostrados: resultado.affectedRows,
                        mensaje: `Se mostraron ${resultado.affectedRows} Quizziz`
                    });
                }
            );
        }
    );
});



//SAHID DE LOS SAHID
app.get("/horario/:idCurso", (req, res) => {

    const idCurso = req.params.idCurso;

    const sql = `
        SELECT
            id_materia AS materia_id,
            id_docente AS docente_id,
            dia,
            hora_inicio,
            hora_fin
        FROM horarios
        WHERE id_curso = ?
        ORDER BY dia, hora_inicio
    `;

    conexion.query(sql, [idCurso], (err, resultados) => {

        if (err) {

            console.error(err);

            return res.status(500).json([]);

        }

        res.json(resultados);

    });

});

app.post("/horario/guardar", (req, res) => {
    const horario = req.body;
    const idCurso = req.query.idCurso;

    console.log("📋 Guardando horario para curso:", idCurso);
    console.log("📋 Datos recibidos:", horario);

    // Validar que se reciba el idCurso
    if (!idCurso) {
        return res.status(400).json({
            ok: false,
            mensaje: "ID de curso no recibido"
        });
    }

    // Si no hay datos, solo eliminamos el horario existente
    if (!Array.isArray(horario) || horario.length === 0) {
        conexion.query(
            "DELETE FROM horarios WHERE id_curso = ?",
            [idCurso],
            (err) => {
                if (err) {
                    console.error("❌ Error eliminando horario:", err);
                    return res.status(500).json({
                        ok: false,
                        mensaje: "Error eliminando horario"
                    });
                }
                res.json({ ok: true, mensaje: "Horario eliminado" });
            }
        );
        return;
    }

    // Verificar que todos los elementos tengan los campos necesarios
    const camposRequeridos = ['id_materia', 'id_docente', 'dia', 'hora_inicio', 'hora_fin'];
    for (const h of horario) {
        for (const campo of camposRequeridos) {
            if (!h[campo]) {
                return res.status(400).json({
                    ok: false,
                    mensaje: `Falta el campo ${campo} en uno de los registros`
                });
            }
        }
    }

    // Iniciar transacción
    conexion.query("START TRANSACTION", (err) => {
        if (err) {
            console.error("❌ Error iniciando transacción:", err);
            return res.status(500).json({ ok: false, mensaje: "Error interno" });
        }

        // Eliminar horario existente
        conexion.query(
            "DELETE FROM horarios WHERE id_curso = ?",
            [idCurso],
            (err) => {
                if (err) {
                    console.error("❌ Error eliminando horario:", err);
                    return conexion.query("ROLLBACK", () => {
                        res.status(500).json({ ok: false, mensaje: "Error eliminando horario" });
                    });
                }

                // Insertar nuevos registros
                const valores = horario.map(h => [
                    idCurso,
                    h.id_materia,
                    h.id_docente,
                    h.dia,
                    h.hora_inicio,
                    h.hora_fin
                ]);

                conexion.query(
                    `INSERT INTO horarios 
                    (id_curso, id_materia, id_docente, dia, hora_inicio, hora_fin) 
                    VALUES ?`,
                    [valores],
                    (err2) => {
                        if (err2) {
                            console.error("❌ Error insertando horario:", err2);
                            return conexion.query("ROLLBACK", () => {
                                res.status(500).json({
                                    ok: false,
                                    mensaje: "Error guardando horario: " + err2.message
                                });
                            });
                        }

                        conexion.query("COMMIT", () => {
                            console.log("✅ Horario guardado correctamente para curso:", idCurso);
                            res.json({
                                ok: true,
                                mensaje: "Horario guardado correctamente",
                                registros: horario.length
                            });
                        });
                    }
                );
            }
        );
    });
});

app.get("/horario-alumno/:usuarioId", (req, res) => {
    const usuarioId = req.params.usuarioId;

    console.log("🔍 Buscando horario para alumno:", usuarioId);

    // Primero obtener el perfil del alumno
    conexion.query(
        `
        SELECT curso, paralelo, especialidad
        FROM perfiles
        WHERE usuario_id = ?
        `,
        [usuarioId],
        (err, perfil) => {
            if (err) {
                console.error("❌ Error obteniendo perfil:", err);
                return res.status(500).json([]);
            }

            if (perfil.length === 0) {
                console.log("⚠️ Perfil no encontrado para usuario:", usuarioId);
                return res.json([]);
            }

            const { curso, paralelo, especialidad } = perfil[0];
            console.log("📚 Datos del perfil:", { curso, paralelo, especialidad });

            // Buscar el curso en la tabla cursos
            let sqlCursos = `
                SELECT id_curso
                FROM cursos
                WHERE nivel = ?
                AND paralelo = ?
            `;

            let params = [curso, paralelo];

            // Si es bachillerato, filtrar por especialidad
            if (curso && (curso.includes('BGU') || curso === '1BGU' || curso === '2BGU' || curso === '3BGU')) {
                sqlCursos += ` AND especializacion = ?`;
                params.push(especialidad);
            } else {
                // Para básica, la especialidad puede ser NULL
                sqlCursos += ` AND (especializacion = ? OR especializacion IS NULL)`;
                params.push(especialidad || '');
            }

            conexion.query(sqlCursos, params, (err2, cursos) => {
                if (err2) {
                    console.error("❌ Error obteniendo curso:", err2);
                    return res.status(500).json([]);
                }

                if (cursos.length === 0) {
                    console.log("⚠️ No se encontró curso para:", { curso, paralelo, especialidad });
                    return res.json([]);
                }

                const idCurso = cursos[0].id_curso;
                console.log("✅ Curso encontrado:", idCurso);

                // Obtener el horario
                conexion.query(
                    `
                    SELECT
                        h.*,
                        m.nombre AS materia,
                        u.nombre AS docente
                    FROM horarios h
                    INNER JOIN materias m ON h.id_materia = m.id
                    INNER JOIN usuarios u ON h.id_docente = u.id
                    WHERE h.id_curso = ?
                    ORDER BY
                        FIELD(h.dia, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'),
                        h.hora_inicio
                    `,
                    [idCurso],
                    (err3, horario) => {
                        if (err3) {
                            console.error("❌ Error obteniendo horario:", err3);
                            return res.status(500).json([]);
                        }

                        console.log(`✅ ${horario.length} registros de horario encontrados`);
                        res.json(horario);
                    }
                );
            });
        }
    );
});

app.get("/control-academico", (req, res) => {

    conexion.query(

        "SELECT * FROM control_academico WHERE id = 1",

        (err, resultado) => {

            if(err){

                console.error(err);

                return res.json({

                    ok:false

                });

            }

            res.json({

                ok:true,

                control: resultado[0]

            });

        }

    );

});
app.put("/control-academico", (req, res) => {

    const {

        notas_bloqueadas,
        conducta_bloqueada,
        fecha_cierre_notas,
        fecha_cierre_conducta

    } = req.body;

    conexion.query(

        `
        UPDATE control_academico

        SET

        notas_bloqueadas=?,
        conducta_bloqueada=?,
        fecha_cierre_notas=?,
        fecha_cierre_conducta=?

        WHERE id=1
        `,

        [

            notas_bloqueadas,
            conducta_bloqueada,
            fecha_cierre_notas,
            fecha_cierre_conducta

        ],

        (err)=>{

            if(err){

                console.error(err);

                return res.json({

                    ok:false

                });

            }

            res.json({

                ok:true

            });

        }

    );

});

app.post("/guardar-control-academico", (req, res) => {
    console.log(req.body);
    const {

        notas_bloqueadas,
        conducta_bloqueada,
        fecha_cierre_notas,
        fecha_cierre_conducta

    } = req.body;

    const sql = `

        UPDATE control_academico

        SET

            notas_bloqueadas = ?,
            conducta_bloqueada = ?,
            fecha_cierre_notas = ?,
            fecha_cierre_conducta = ?,

            cierre_notas_ejecutado = 0,
            cierre_conducta_ejecutado = 0

        WHERE id = 1

    `;

    conexion.query(

        sql,

        [

            notas_bloqueadas,
            conducta_bloqueada,
            fecha_cierre_notas,
            fecha_cierre_conducta

        ],

        (err) => {

            if(err){

                console.error(err);

                return res.json({

                    ok:false

                });

            }

            res.json({

                ok:true

            });

        }

    );

});

app.get("/estado-control-academico", (req, res) => {

    conexion.query(

        `
        SELECT

            notas_bloqueadas,
            conducta_bloqueada

        FROM control_academico

        WHERE id = 1
        `,

        (err, resultado) => {

            if(err){

                console.error(err);

                return res.json({
                    ok:false
                });

            }

            res.json({

                ok:true,

                estado: resultado[0]

            });

        }

    );

});

app.post("/desbloquear-notas-docente", (req, res) => {

    const {

        docente_id,
        soporte_id

    } = req.body;

    conexion.query(

        `
        SELECT id

        FROM autorizaciones

        WHERE solicitado_por = ?

        AND accion = 'desbloquear_notas'

        AND estado = 'aprobado'

        AND fecha_expiracion > NOW()
        `,

        [docente_id],

        (err, resultado) => {

            if (err) {

                console.error(err);

                return res.json({

                    ok: false

                });

            }

            // Ya existe una autorización activa
            if (resultado.length > 0) {

                return res.json({

                    ok: false,

                    mensaje: "Este docente ya tiene una autorización vigente."

                });

            }

            // Expira en 24 horas
            const expiracion = new Date(
                Date.now() + 24 * 60 * 60 * 1000
            );

            conexion.query(

                `
                INSERT INTO autorizaciones
                (

                    accion,
                    solicitado_por,
                    autorizado_por,
                    estado,
                    fecha_expiracion

                )

                VALUES (?,?,?,?,?)
                `,

                [

                    "desbloquear_notas",

                    docente_id,

                    soporte_id,

                    "aprobado",

                    expiracion

                ],

                (err) => {

                    if (err) {

                        console.error(err);

                        return res.json({

                            ok: false,

                            mensaje: err.message

                        });

                    }

                    console.log("✅ Autorización creada correctamente.");

                    res.json({

                        ok: true,

                        mensaje: "Notas desbloqueadas durante 24 horas."

                    });

                }

            );

        }

    );

});

app.post("/desbloquear-conducta-docente", (req, res) => {

    const { docente_id, soporte_id } = req.body;

    console.log("==================================");
    console.log("DESBLOQUEAR CONDUCTA");
    console.log("Docente:", docente_id);
    console.log("Soporte:", soporte_id);

    conexion.query(

        `
        SELECT id
        FROM autorizaciones
        WHERE solicitado_por = ?
        AND accion = 'desbloquear_conducta'
        AND estado = 'aprobado'
        AND fecha_expiracion > NOW()
        `,

        [docente_id],

        (err, resultado) => {

            if (err) {

                console.error(err);

                return res.json({ ok:false });

            }

            console.log("Resultado SELECT:", resultado);

            if(resultado.length > 0){

                console.log("YA EXISTE AUTORIZACIÓN");

                return res.json({

                    ok:false,

                    mensaje:"Este docente ya tiene una autorización vigente."

                });

            }

            console.log("NO EXISTE AUTORIZACIÓN");
            console.log("INSERTANDO...");

            const expiracion = new Date(
                Date.now() + 24*60*60*1000
            );

            conexion.query(

                `
                INSERT INTO autorizaciones
                (
                    accion,
                    solicitado_por,
                    autorizado_por,
                    estado,
                    fecha_expiracion
                )
                VALUES (?,?,?,?,?)
                `,

                [
                    "desbloquear_conducta",
                    docente_id,
                    soporte_id,
                    "aprobado",
                    expiracion
                ],

                (err)=>{

                    if(err){

                        console.error("ERROR INSERT:", err);

                        return res.json({ok:false});

                    }

                    console.log("INSERT REALIZADO");

                    res.json({ok:true});

                }

            );

        }

    );

});

// ============================================
// ENDPOINTS PARA GESTIÓN DE FOROS (SOPORTE)
// ============================================

// Obtener todos los foros con estado de visibilidad
app.get("/foros-soporte", (req, res) => {
    conexion.query(
        `SELECT 
            f.*,
            u.nombre AS docente_nombre,
            CASE WHEN f.visible = 1 THEN 'visible' ELSE 'oculto' END AS estado_visual
        FROM foro f
        LEFT JOIN usuarios u ON f.docente = u.nombre
        ORDER BY f.fecha DESC`,
        (error, resultados) => {
            if (error) {
                console.error("❌ Error al obtener foros:", error);
                return res.status(500).json([]);
            }
            res.json(resultados);
        }
    );
});

// Ocultar un foro (visible = false)
app.put("/ocultar-foro/:id", (req, res) => {
    const { id } = req.params;
    
    conexion.query(
        "UPDATE foro SET visible = 0 WHERE id = ?",
        [id],
        (error, resultado) => {
            if (error) {
                console.error("❌ Error al ocultar foro:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al ocultar el foro"
                });
            }
            
            if (resultado.affectedRows > 0) {
                res.json({
                    ok: true,
                    mensaje: "Foro ocultado correctamente"
                });
            } else {
                res.json({
                    ok: false,
                    mensaje: "No se encontró el foro"
                });
            }
        }
    );
});

// Mostrar un foro (visible = true)
app.put("/mostrar-foro/:id", (req, res) => {
    const { id } = req.params;
    
    conexion.query(
        "UPDATE foro SET visible = 1 WHERE id = ?",
        [id],
        (error, resultado) => {
            if (error) {
                console.error("❌ Error al mostrar foro:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al mostrar el foro"
                });
            }
            
            if (resultado.affectedRows > 0) {
                res.json({
                    ok: true,
                    mensaje: "Foro mostrado correctamente"
                });
            } else {
                res.json({
                    ok: false,
                    mensaje: "No se encontró el foro"
                });
            }
        }
    );
});

// ============================================
// ENDPOINTS PARA GESTIÓN DE QUIZZIZ (SOPORTE)
// ============================================

// Obtener todos los quizzes con estado de visibilidad
app.get("/quizzes-soporte", (req, res) => {
    conexion.query(
        `SELECT 
            q.*,
            m.nombre AS materia_nombre,
            u.nombre AS docente_nombre,
            CASE WHEN q.visible = 1 THEN 'visible' ELSE 'oculto' END AS estado_visual,
            (SELECT COUNT(*) FROM preguntas_quiz WHERE quiz_id = q.id) AS total_preguntas,
            (SELECT COUNT(*) FROM resultados_quiz WHERE quiz_id = q.id) AS total_resultados
        FROM quizzes q
        LEFT JOIN materias m ON q.materia_id = m.id
        LEFT JOIN usuarios u ON q.docente_id = u.id
        ORDER BY q.id DESC`,
        (error, resultados) => {
            if (error) {
                console.error("❌ Error al obtener quizzes:", error);
                return res.status(500).json([]);
            }
            res.json(resultados);
        }
    );
});

// Ocultar un quiz (visible = false)
app.put("/ocultar-quiz/:id", (req, res) => {
    const { id } = req.params;
    
    conexion.query(
        "UPDATE quizzes SET visible = 0 WHERE id = ?",
        [id],
        (error, resultado) => {
            if (error) {
                console.error("❌ Error al ocultar quiz:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al ocultar el quiz"
                });
            }
            
            if (resultado.affectedRows > 0) {
                res.json({
                    ok: true,
                    mensaje: "Quiz ocultado correctamente"
                });
            } else {
                res.json({
                    ok: false,
                    mensaje: "No se encontró el quiz"
                });
            }
        }
    );
});

// Mostrar un quiz (visible = true)
app.put("/mostrar-quiz/:id", (req, res) => {
    const { id } = req.params;
    
    conexion.query(
        "UPDATE quizzes SET visible = 1 WHERE id = ?",
        [id],
        (error, resultado) => {
            if (error) {
                console.error("❌ Error al mostrar quiz:", error);
                return res.status(500).json({
                    ok: false,
                    mensaje: "Error al mostrar el quiz"
                });
            }
            
            if (resultado.affectedRows > 0) {
                res.json({
                    ok: true,
                    mensaje: "Quiz mostrado correctamente"
                });
            } else {
                res.json({
                    ok: false,
                    mensaje: "No se encontró el quiz"
                });
            }
        }
    );
});