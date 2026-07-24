async function obtenerTodosAlumnos() {

    try {

        const res = await fetch("http://localhost:3000/usuarios");
        const usuarios = await res.json();

        return usuarios.filter(
            u => u.rol === "alumno"
        );

    } catch (error) {

        console.error(error);
        return [];
    }
}

async function obtenerAsistencias() {

    try {

        const res = await fetch(
            "http://localhost:3000/asistencias"
        );

        return await res.json();

    } catch(error) {

        console.error(error);
        return [];
    }
}

function actualizarFechaHora() {

    const ahora = new Date();

    const fecha =
        ahora.toLocaleDateString("es-EC");

    const hora =
        ahora.toLocaleTimeString("es-EC");

    const texto =
        `📅 ${fecha} | 🕒 ${hora}`;

    const alumno =
        document.getElementById(
            "fechaHoraAlumno"
        );

    const docente =
        document.getElementById(
            "fechaHoraDocente"
        );

    const rector =
        document.getElementById(
            "fechaHoraRector"
        );

    if (alumno) alumno.innerHTML = texto;

    if (docente) docente.innerHTML = texto;

    if (rector) rector.innerHTML = texto;
}
actualizarFechaHora();

setInterval(
    actualizarFechaHora,
    1000
);

/* ==========================================
   MODO OSCURO
========================================== */

function cambiarModo() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "modoOscuro",
        document.body.classList.contains("dark")
    );

}

document.addEventListener("DOMContentLoaded", () => {

    if(localStorage.getItem("modoOscuro") === "true"){

        document.body.classList.add("dark");

    }

});