<h1 align="center">NutriFav</h1>

<p align="center">
  <strong>Sistema de gestión integral para consultorios de nutrición</strong><br>
  Administra pacientes, agenda de citas, planes alimenticios y seguimiento antropométrico.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-27.0.0-47848F?logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
  <img src="https://img.shields.io/badge/Status-En%20Desarrollo-yellow" />
</p>

---

## 📸 Capturas de Pantalla

<div align="center">
  <img src="screenshots/dashboard.png" width="45%" alt="Dashboard" />
  <img src="screenshots/agenda.png" width="45%" alt="Agenda" />
  <br />
  <img src="screenshots/pacientes.png" width="45%" alt="Lista de pacientes" />
  <img src="screenshots/cita-modal.png" width="45%" alt="Modal de citas" />
  <img src="screenshots/dieta.png" width="45%" alt="Dietas diarias" />
</div>

---

## 🚀 Características Principales

- 👤 **Gestión de Pacientes**: Expediente clínico completo (datos personales, hábitos, antecedentes).
- 📊 **Seguimiento Antropométrico**: Registro de peso, IMC, pliegues, circunferencias y progreso visual con gráficos.
- 🍽️ **Plan Alimenticio**: Editor de comidas por día con macros, etiquetas y generación de PDF del plan semanal.
- 📸 **Galería de Fotos**: Subida y comparativa de fotos de progreso (Frente/Perfil).
- 📋 **Tareas**: Sistema de tareas pendientes (Clínicas, Administrativas, Seguimiento).

---

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Framework de Escritorio**: Electron
- **Base de Datos**: SQLite3
- **Seguridad**: Bcryptjs (hashing de contraseñas)
- **Reportes**: jsPDF + html2canvas (generación de PDFs)

---

## ⚙️ Instalación y Ejecución Local

Sigue estos pasos para tener el proyecto corriendo en tu máquina:

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/[TU-USUARIO]/nutrifav.git
   cd nutrifav

2. **Instalar dependencias**
npm install

3. **Ejecutar la aplicación**
npm start
