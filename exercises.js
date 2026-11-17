/*
  Catálogo de ejercicios de GymTracker.
  Para editarlo: agrega, borra o renombra líneas. Cada ejercicio tiene
    - nombre (como aparece en la app)
    - grupos: uno o más de GT_GROUPS
    - equipo: "barra", "mancuernas", "maquina", "polea" o "corporal"
      (define los saltos de peso por defecto de ese ejercicio)
  Dentro de cada grupo, los primeros son los que la app sugiere antes.
  Ojo: si renombras un ejercicio que ya usaste, tu historial queda con el nombre antiguo.
*/
window.GT_GROUPS = [
  "Pecho", "Hombro", "Tríceps",
  "Espalda", "Hombro posterior", "Bíceps",
  "Cuádriceps", "Isquios y glúteos", "Pantorrilla",
  "Core",
];

/* Qué grupos entrena cada rutina. Una rutina propia ("Brazo y hombro"…) se arma con tu historial. */
window.GT_ROUTINES = {
  "Push": ["Pecho", "Hombro", "Tríceps"],
  "Pull": ["Espalda", "Hombro posterior", "Bíceps"],
  "Pierna": ["Cuádriceps", "Isquios y glúteos", "Pantorrilla", "Core"],
  "Upper": ["Pecho", "Espalda", "Hombro", "Hombro posterior", "Bíceps", "Tríceps"],
  "Lower": ["Cuádriceps", "Isquios y glúteos", "Pantorrilla", "Core"],
  "Full body": ["Cuádriceps", "Pecho", "Espalda", "Isquios y glúteos", "Hombro", "Bíceps", "Tríceps", "Core"],
};

window.GT_CATALOG = [
  // Pecho
  ["Press banca", ["Pecho"], "barra"],
  ["Press inclinado con barra", ["Pecho"], "barra"],
  ["Press banca con mancuernas", ["Pecho"], "mancuernas"],
  ["Press inclinado con mancuernas", ["Pecho"], "mancuernas"],
  ["Press de pecho en máquina", ["Pecho"], "maquina"],
  ["Press inclinado en máquina", ["Pecho"], "maquina"],
  ["Aperturas en polea", ["Pecho"], "polea"],
  ["Aperturas en máquina (pec deck)", ["Pecho"], "maquina"],
  ["Aperturas con mancuernas", ["Pecho"], "mancuernas"],
  ["Press declinado con barra", ["Pecho"], "barra"],
  ["Fondos", ["Pecho", "Tríceps"], "corporal"],
  ["Flexiones de brazos", ["Pecho"], "corporal"],

  // Hombro
  ["Press militar", ["Hombro"], "barra"],
  ["Press de hombros con mancuernas", ["Hombro"], "mancuernas"],
  ["Press de hombros en máquina", ["Hombro"], "maquina"],
  ["Elevaciones laterales", ["Hombro"], "mancuernas"],
  ["Elevaciones laterales en polea", ["Hombro"], "polea"],
  ["Elevaciones laterales en máquina", ["Hombro"], "maquina"],
  ["Press Arnold", ["Hombro"], "mancuernas"],
  ["Elevaciones frontales", ["Hombro"], "mancuernas"],

  // Tríceps
  ["Extensión de tríceps", ["Tríceps"], "polea"],
  ["Extensión de tríceps con cuerda", ["Tríceps"], "polea"],
  ["Extensión de tríceps sobre la cabeza en polea", ["Tríceps"], "polea"],
  ["Press francés", ["Tríceps"], "barra"],
  ["Extensión de tríceps con mancuerna sobre la cabeza", ["Tríceps"], "mancuernas"],
  ["Press banca agarre cerrado", ["Tríceps", "Pecho"], "barra"],
  ["Patada de tríceps", ["Tríceps"], "mancuernas"],
  ["Fondos en banco", ["Tríceps"], "corporal"],

  // Espalda
  ["Dominadas", ["Espalda"], "corporal"],
  ["Jalón al pecho", ["Espalda"], "polea"],
  ["Remo con barra", ["Espalda"], "barra"],
  ["Remo con mancuerna", ["Espalda"], "mancuernas"],
  ["Remo sentado en polea", ["Espalda"], "polea"],
  ["Remo en máquina", ["Espalda"], "maquina"],
  ["Jalón agarre cerrado", ["Espalda"], "polea"],
  ["Remo en T", ["Espalda"], "barra"],
  ["Pullover en polea", ["Espalda"], "polea"],
  ["Dominadas asistidas", ["Espalda"], "maquina"],
  ["Encogimientos de hombros", ["Espalda"], "mancuernas"],
  ["Hiperextensiones", ["Espalda", "Isquios y glúteos"], "corporal"],

  // Hombro posterior
  ["Face pull", ["Hombro posterior"], "polea"],
  ["Pájaros en máquina (pec deck invertido)", ["Hombro posterior"], "maquina"],
  ["Pájaros con mancuernas", ["Hombro posterior"], "mancuernas"],

  // Bíceps
  ["Curl de bíceps", ["Bíceps"], "barra"],
  ["Curl con mancuernas", ["Bíceps"], "mancuernas"],
  ["Curl martillo", ["Bíceps"], "mancuernas"],
  ["Curl en banco Scott", ["Bíceps"], "barra"],
  ["Curl en polea", ["Bíceps"], "polea"],
  ["Curl inclinado con mancuernas", ["Bíceps"], "mancuernas"],
  ["Curl concentrado", ["Bíceps"], "mancuernas"],

  // Cuádriceps
  ["Sentadilla", ["Cuádriceps", "Isquios y glúteos"], "barra"],
  ["Prensa de piernas", ["Cuádriceps"], "maquina"],
  ["Extensión de cuádriceps", ["Cuádriceps"], "maquina"],
  ["Sentadilla hack", ["Cuádriceps"], "maquina"],
  ["Sentadilla búlgara", ["Cuádriceps", "Isquios y glúteos"], "mancuernas"],
  ["Zancadas", ["Cuádriceps", "Isquios y glúteos"], "mancuernas"],
  ["Sentadilla frontal", ["Cuádriceps"], "barra"],
  ["Sentadilla goblet", ["Cuádriceps"], "mancuernas"],
  ["Sentadilla en Smith", ["Cuádriceps"], "maquina"],

  // Isquios y glúteos
  ["Peso muerto", ["Isquios y glúteos", "Espalda"], "barra"],
  ["Peso muerto rumano", ["Isquios y glúteos"], "barra"],
  ["Curl femoral acostado", ["Isquios y glúteos"], "maquina"],
  ["Curl femoral sentado", ["Isquios y glúteos"], "maquina"],
  ["Hip thrust", ["Isquios y glúteos"], "barra"],
  ["Abducción de cadera en máquina", ["Isquios y glúteos"], "maquina"],
  ["Aducción de cadera en máquina", ["Isquios y glúteos"], "maquina"],
  ["Patada de glúteo en polea", ["Isquios y glúteos"], "polea"],
  ["Peso muerto rumano con mancuernas", ["Isquios y glúteos"], "mancuernas"],

  // Pantorrilla
  ["Elevación de talones de pie", ["Pantorrilla"], "maquina"],
  ["Elevación de talones sentado", ["Pantorrilla"], "maquina"],
  ["Pantorrilla en prensa", ["Pantorrilla"], "maquina"],

  // Core
  ["Crunch en polea", ["Core"], "polea"],
  ["Elevación de piernas colgado", ["Core"], "corporal"],
  ["Crunch abdominal", ["Core"], "corporal"],
  ["Rueda abdominal", ["Core"], "corporal"],
  ["Crunch en máquina", ["Core"], "maquina"],
].map(([name, groups, equip]) => ({ name, groups, equip }));
