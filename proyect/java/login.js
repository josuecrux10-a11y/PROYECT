function escaparHTML(texto) {
    if (!texto) return "";
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function volverInicio() {
    document.getElementById("pantallaInicio").style.display = "flex";
    document.getElementById("registro").style.display = "none";
    document.getElementById("formLogin").style.display = "none";
}

function mostrarMensaje(texto, tipo) {
    let mensaje = document.getElementById("mensaje");
    if (!mensaje) return;
    mensaje.innerText = texto;
    mensaje.style.color = tipo === "error" ? "#e13b28" : "#28e13b";
    setTimeout(() => mensaje.innerText = "", 4000);
}

function mostrarRegistro() {
    document.getElementById("pantallaInicio").style.display = "none";
    document.getElementById("registro").style.display = "flex";
    document.getElementById("formLogin").style.display = "none";
    document.getElementById("regRol").value = "";
    document.getElementById("cursoAlumno").style.display = "none";
    document.getElementById("especialidadAlumno").style.display = "none";
    document.getElementById("materiasDocente").style.display = "none";
    document.getElementById("claveRector").style.display = "none";
}

function mostrarLogin() {
    document.getElementById("pantallaInicio").style.display = "none";
    document.getElementById("registro").style.display = "none";
    document.getElementById("formLogin").style.display = "flex";
}

//Login Principal
async function login() {
    let userInput = document.getElementById("logNombre")?.value.trim() || "";
    let passInput = document.getElementById("logPass")?.value || "";

    if (userInput === "" || passInput === "") {
        alert("⚠️ Complete todos los campos.");
        return;
    }

    try {
        const respuesta = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre: userInput,
                password: passInput
            })
        });

        const datos = await respuesta.json();

        if (datos.encontrado) {
            let user = datos.usuario;

            let sesionNormalizada = {
                id: user.id,
                nombreCompleto: user.nombre,
                rol: user.rol,
                clave: user.password,
                paralelo: "",
                asignado: false
            };

            localStorage.setItem("sesion", JSON.stringify(sesionNormalizada));

            // Ocultar vistas iniciales de forma segura
            const pInicio = document.getElementById("pantallaInicio");
            if (pInicio) pInicio.style.display = "none";
            
            const fLogin = document.getElementById("formLogin");
            if (fLogin) fLogin.style.display = "none";
            
            const reg = document.getElementById("registro");
            if (reg) reg.style.display = "none";

            if (user.rol === "alumno") {
                modoBotonFlotante = "ticket";
                revisarRespuestasSoporte();
                
                const iconoFlotante = document.getElementById("iconoBotonFlotante");
                if (iconoFlotante) iconoFlotante.src = "img/usuario_soporte.png";

                const panelAlumno = document.getElementById("panelAlumno");
                if (panelAlumno) panelAlumno.style.display = "block";

                cargarMateriasAlumno();

                let usuarioActivo = document.getElementById("usuarioActivo");
                if (usuarioActivo) {
                    usuarioActivo.innerText = `👤 ${user.nombre || user.nombreCompleto}`;
                }

                verificarNombreReal();
                mostrarSeccion("perfil");
                verificarRespuestasSoporte();

                setTimeout(() => {
                    verificarYCambiarContrasenaAlumno(user.id);
                }, 500);

            } else if (user.rol === "docente") {
                modoBotonFlotante = "ticket";
                revisarRespuestasSoporte();

                const iconoFlotante = document.getElementById("iconoBotonFlotante");
                if (iconoFlotante) iconoFlotante.src = "img/usuario_soporte.png";

                const panelDocente = document.getElementById("panelDocente");
                if (panelDocente) panelDocente.style.display = "block";

                await cargarDatosDocentePerfil();
                await cargarPerfilDocente();

                document.body.style.background = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";

                // ✅ CORREGIDO: Verificación antes de asignar innerText
                const docenteActivo = document.getElementById("docenteActivo");
                if (docenteActivo) {
                    docenteActivo.innerText = `👨‍🏫 ${user.nombre}`;
                }

                const nombrePerfil = document.getElementById("nombreDocentePerfil");
                if (nombrePerfil) {
                    nombrePerfil.innerText = user.nombre;
                }

                mostrarDocente("perfilD");
                await cargarMateriasDocente();
                verificarRespuestasSoporte();

                setTimeout(() => {
                    verificarYCambiarContrasenaAlumno(user.id);
                }, 500);

            } else if (user.rol === "rector") {
                modoBotonFlotante = "ticket";
                revisarRespuestasSoporte();

                const iconoFlotante = document.getElementById("iconoBotonFlotante");
                if (iconoFlotante) iconoFlotante.src = "img/usuario_soporte.png";

                const panelRector = document.getElementById("panelRector");
                if (panelRector) panelRector.style.display = "block";

                document.body.style.background = "#ffffff";

                cargarPanelRector();
                cargarSolicitudesMaterias();
                cargarDocentesAsignados();
                verificarAutorizacionRestablecimiento();
                verificarRespuestasSoporte();
                await cargarControlAcademico();

                setTimeout(() => {
                    verificarYCambiarContrasenaAlumno(user.id);
                }, 500);

            } else if (user.rol === "soporte") {
                const panelSoporte = document.getElementById("panelSoporte");
                if (panelSoporte) panelSoporte.style.display = "block";
            }

        } else {
            // ✅ CORREGIDO: Verificación si existe el contenedor de mensaje
            const contenedorMensaje = document.getElementById("mensaje");
            if (contenedorMensaje) {
                contenedorMensaje.innerText = "❌ Usuario o contraseña incorrectos";
                contenedorMensaje.style.color = "#e74c3c";
            } else {
                alert("❌ Usuario o contraseña incorrectos");
            }
        }

    } catch (error) {
        console.error("❌ Error en función login:", error);
        alert("❌ Error conectando con el servidor");
    }
}

function cerrarSesion() {
    modoBotonFlotante = "login";
    document.getElementById("iconoBotonFlotante").src = "img/soporte.png";
    localStorage.removeItem("sesion");
    location.reload();
}

function cerrarSesion(){
    modoBotonFlotante = "login";

    document.getElementById("iconoBotonFlotante").src =
    "img/soporte.png";

    localStorage.removeItem("sesion");
    location.reload();
}
