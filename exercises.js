/*
  Catálogo de ejercicios de GymTracker.
  Para editarlo: agrega, borra o renombra líneas. Cada ejercicio tiene
    - nombre (como aparece en la app)
    - grupos: uno o más de GT_GROUPS
    - equipo: "barra", "mancuernas", "maquina", "polea" o "corporal"
      (define los saltos de peso por defecto de ese ejercicio)
  Dentro de cada grupo, los primeros son los que la app sugiere antes.
  Si renombras un ejercicio que ya usaste, agrega el nombre antiguo a GT_RENAMES y el historial se actualiza solo.
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

/* Nombres antiguos → nombre actual. Tu historial se actualiza solo al abrir la app. */
window.GT_RENAMES = {
  "Aperturas en máquina (pec deck)": "Pec deck",
  "Extensión de tríceps sobre la cabeza en polea": "Extensión katana unilateral en polea",
};

window.GT_CATALOG = [
  // Pecho
  ["Press banca", ["Pecho"], "barra"],
  ["Press inclinado con mancuernas", ["Pecho"], "mancuernas"],
  ["Press de pecho en máquina", ["Pecho"], "maquina"],
  ["Pec deck", ["Pecho"], "maquina"],
  ["Flexiones de brazos", ["Pecho"], "corporal"],

  // Hombro
  ["Press militar", ["Hombro"], "barra"],
  ["Elevaciones laterales en polea", ["Hombro"], "polea"],
  ["Elevaciones laterales", ["Hombro"], "mancuernas"],

  // Tríceps
  ["Extensión de tríceps", ["Tríceps"], "polea"],
  ["Extensión katana unilateral en polea", ["Tríceps"], "polea"],
  ["Press francés", ["Tríceps"], "barra"],

  // Espalda
  ["Dominadas", ["Espalda"], "corporal"],
  ["Jalón al pecho", ["Espalda"], "polea"],
  ["Remo en máquina", ["Espalda"], "maquina"],
  ["Remo en T", ["Espalda"], "barra"],
  ["Pullover en polea", ["Espalda"], "polea"],

  // Hombro posterior
  ["Face pull", ["Hombro posterior"], "polea"],
  ["Jalón de hombro posterior en polea", ["Hombro posterior"], "polea"],

  // Bíceps
  ["Curl con mancuernas", ["Bíceps"], "mancuernas"],
  ["Curl martillo", ["Bíceps"], "mancuernas"],
  ["Curl en polea", ["Bíceps"], "polea"],
  ["Curl inclinado con mancuernas", ["Bíceps"], "mancuernas"],

  // Cuádriceps
  ["Sentadilla", ["Cuádriceps", "Isquios y glúteos"], "barra"],
  ["Prensa de piernas", ["Cuádriceps"], "maquina"],
  ["Extensión de cuádriceps", ["Cuádriceps"], "maquina"],
  ["Sentadilla hack", ["Cuádriceps"], "maquina"],
  ["Sentadilla búlgara", ["Cuádriceps", "Isquios y glúteos"], "mancuernas"],

  // Isquios y glúteos
  ["Peso muerto", ["Isquios y glúteos", "Espalda"], "barra"],
  ["Hip thrust", ["Isquios y glúteos"], "barra"],
  ["Abducción de cadera en máquina", ["Isquios y glúteos"], "maquina"],
  ["Aducción de cadera en máquina", ["Isquios y glúteos"], "maquina"],
  ["Peso muerto rumano", ["Isquios y glúteos"], "barra"],

  // Pantorrilla
  ["Elevación de talones de pie", ["Pantorrilla"], "maquina"],
  ["Elevación de talones sentado", ["Pantorrilla"], "maquina"],
  ["Pantorrilla en prensa", ["Pantorrilla"], "maquina"],

  // Core
  ["Crunch en polea", ["Core"], "polea"],
  ["Crunch abdominal", ["Core"], "corporal"],
  ["Crunch en máquina", ["Core"], "maquina"],
].map(([name, groups, equip]) => ({ name, groups, equip }));
