let alumnosBase = {};
let usuariosRegistrados = [];
let fotoBase64 = "";

document.addEventListener("DOMContentLoaded", () => {

    const rol = document.getElementById("regRol");
    const panel = document.getElementById("materiasDocente");

    if (rol && panel) {
        rol.addEventListener("change", function () {
            panel.style.display =
                this.value === "docente"
                ? "block"
                : "none";
        });
    }

    // FOTO DEL DOCENTE
    const fotoDocente =
        document.getElementById("fotoDocente");

    if (fotoDocente) {

        fotoDocente.addEventListener("change", function(e){

            const archivo = e.target.files[0];

            if(!archivo) return;

            const lector = new FileReader();

            lector.onload = function(ev){

                document.getElementById("fotoPreview").src =
                    ev.target.result;
            };

            lector.readAsDataURL(archivo);
        });
    }

});

document.getElementById("cursoAlumno").addEventListener("change", function() {

    let especialidad =
        document.getElementById(
            "especialidadAlumno"
        );

    if (
        ["1BGU", "2BGU", "3BGU"]
        .includes(this.value)
    ) {

        especialidad.style.display =
            "block";

    } else {

        especialidad.style.display =
            "none";

        especialidad.value = "";
    }

});

document.getElementById("regRol").addEventListener("change", function() {

    let materias =
        document.getElementById("materiasDocente");

    let curso =
        document.getElementById("cursoAlumno");

    let especialidad =
        document.getElementById("especialidadAlumno");

    let claveRector =
        document.getElementById("claveRector");

    // Ocultar todo primero
    materias.style.display = "none";
    curso.style.display = "none";
    especialidad.style.display = "none";
    claveRector.style.display = "none";

    if (this.value === "alumno") {

        curso.style.display = "block";

        especialidad.style.display = "none";
        especialidad.value = "";

    }

    else if (this.value === "docente") {

        materias.style.display = "block";

    }

    else if (this.value === "rector") {

        claveRector.style.display = "block";

    }

});

document.getElementById("cursoAlumno").addEventListener("change", function() {

    const especialidad =
        document.getElementById("especialidadAlumno");

    if (
        this.value === "1BGU" ||
        this.value === "2BGU" ||
        this.value === "3BGU"
    ) {

        especialidad.style.display = "block";

    } else {

        especialidad.style.display = "none";
        especialidad.value = "";

    }

});

const materiasIds = {
    "Matemáticas": 1,
    "Inglés": 2,
    "Ciudadanía": 3,
    "Química": 4,
    "Emprendimiento": 5,
    "Lengua y Literatura": 6,
    "Biología": 7,
    "Historia": 8,
    "Educación Física": 9,
    "Tutoría": 10,
    "Proyecto": 11,
    "Computación": 12
};

async function registrar() {

    let rol =
        document.getElementById("regRol").value;

    let nombreCompleto = "";

    if (rol === "docente") {

        const titulo =
            document.getElementById("tituloDocente").value;

        const nombre =
            document.getElementById("regNombre").value.trim();

        nombreCompleto =
            `${titulo} ${nombre}`;

    } else {

        nombreCompleto =
            document.getElementById("regNombreSolo").value.trim();

    }

    let pass =
        document.getElementById("regPass").value;

    let cursoAlumno =
        document.getElementById("cursoAlumno")?.value || "";

    let especialidadAlumno =
        document.getElementById("especialidadAlumno")?.value || "";

    let claveRector =
        document.getElementById("claveRector")?.value.trim() || "";

    if (!rol) {

        return mostrarMensaje(
            "❌ Seleccione un rol",
            "error"
        );

    }

    if (!nombreCompleto || !pass) {

        return mostrarMensaje(
            "❌ Completa todos los campos",
            "error"
        );

    }

    if (rol === "alumno") {

        if (!cursoAlumno) {

            return mostrarMensaje(
                "❌ Seleccione un curso",
                "error"
            );

        }

        if (
            ["1BGU", "2BGU", "3BGU"].includes(cursoAlumno)
            &&
            !especialidadAlumno
        ) {

            return mostrarMensaje(
                "❌ Seleccione una especialidad",
                "error"
            );

        }
    }

    try {

        let materiasSeleccionadas = [];

        if (rol === "docente") {

            materiasSeleccionadas = Array.from(
                document.querySelectorAll(
                    "#materiasDocente input:checked"
                )
            ).map(c => c.value);

        }

        const existeRes = await fetch(
            "http://localhost:3000/verificar-usuario",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre: nombreCompleto
                })
            }
        );

        const existeData =
            await existeRes.json();

        if (existeData.existe) {

            return mostrarMensaje(
                "❌ Usuario ya existe",
                "error"
            );

        }

        const res = await fetch(
            "http://localhost:3000/registrar",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre: nombreCompleto,
                    password: pass,
                    rol: rol,
                    curso: cursoAlumno,
                    especialidad: especialidadAlumno,
                    materias: materiasSeleccionadas
                })
            }
        );

        const data = await res.json();

        console.log(data);

        mostrarMensaje(
            "✅ Usuario registrado correctamente",
            "success"
        );

        if (document.getElementById("regNombre")) {

            document.getElementById("regNombre").value = "";

        }

        if (document.getElementById("regNombreSolo")) {

            document.getElementById("regNombreSolo").value = "";

        }

        document.getElementById("regPass").value = "";

        document
            .querySelectorAll(
                "#materiasDocente input:checked"
            )
            .forEach(c => c.checked = false);

        cargarPanelRector();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "❌ Error al registrar",
            "error"
        );

    }
}

function cambiarRolRegistro() {

    let rol =
        document.getElementById("regRol").value;

    let curso =
        document.getElementById("cursoAlumno");

    let especialidad =
        document.getElementById("especialidadAlumno");

    let materias =
        document.getElementById("materiasDocente");

    let claveRector =
        document.getElementById("claveRector");

    let contenedorTitulo =
    document.getElementById("contenedorTituloDocente");

    let nombreNormal =
    document.getElementById("regNombreSolo");

    curso.style.display = "none";
    especialidad.style.display = "none";
    materias.style.display = "none";
    claveRector.style.display = "none";
    contenedorTitulo.style.display = "none";
    nombreNormal.style.display = "block";

    if (rol === "alumno") {

        curso.style.display = "block";
    }

    if (rol === "docente") {

        materias.style.display = "block";

        contenedorTitulo.style.display = "flex";

        nombreNormal.style.display = "none";
    }

    if (rol === "rector") {

        claveRector.style.display = "block";
    }

}
