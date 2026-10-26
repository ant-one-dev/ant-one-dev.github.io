// ─────────────────────────────────────────────────────────────
//  All portfolio content lives here, in French and English.
//  L(fr, en) holds both versions of a text. Edit freely —
//  no build step needed.
// ─────────────────────────────────────────────────────────────
const L = (fr, en) => ({ fr, en });

export const profile = {
  name: 'Antoine Mroczko',
  email: 'antoinemroczko@gmail.com',
  github: 'https://github.com/ant-one-dev',
  linkedin: 'https://www.linkedin.com/in/antoine-mroczko/',
  cv: 'assets/CV_Antoine_Mroczko.pdf',
  roles: L(
    ['la conception FPGA & VHDL', 'le firmware en C/C++', 'la robotique & les drones', 'la vision embarquée', 'les systèmes temps réel'],
    ['FPGA & VHDL design', 'firmware in C/C++', 'robotics & drones', 'computer vision on the edge', 'real-time embedded systems'],
  ),
};

// Featured projects get a large interactive visual.
// visual: 'robot' | 'fpga' | 'automata' | 'nn' | 'audio' | 'video' (plays `video`, shows `poster` before)
// gif: shows this animation instead of a generated visual
// cats: categories used by the project filters.
export const featured = [
  {
    id: 'octomap',
    title: 'OctoMap Drone Explorer',
    subtitle: L('Drone LiDAR qui cartographie un musée en 3D, en temps réel', 'A LiDAR drone mapping a museum in 3D, in real time'),
    year: '2026',
    visual: 'video',
    video: 'assets/projects/octomap-scan.mp4',
    poster: 'assets/projects/octomap-scan.jpg',
    cats: ['embedded', 'software'],
    summary: L(
      'Un drone équipé d’un LiDAR 3D survole un musée de quatre niveaux simulé sous Gazebo et construit une carte 3D probabiliste en temps réel avec ROS 2. J’ai réécrit en Python le cœur d’OctoMap (log-odds, lancer de rayons, clamping, élagage de l’octree, format .bt), puis vérifié les cartes exportées avec la bibliothèque officielle.',
      'A drone with a 3D LiDAR flies through a four-level museum simulated in Gazebo and builds a probabilistic 3D map in real time with ROS 2. I rebuilt the core of OctoMap in Python (log-odds, ray casting, clamping, octree pruning, the .bt format), then checked the exported maps with the official library.',
    ),
    bullets: L([
      ['Carte probabiliste', 'Chaque rayon marque son point d’arrivée comme occupé (+0,85) et les voxels traversés comme libres (−0,41), en log-odds. Un point fantôme disparaît après trois rayons.'],
      ['Octree & format .bt', 'Arbre à 16 niveaux où huit feuilles identiques fusionnent. Les fichiers .bt s’ouvrent avec liboctomap : même nombre de nœuds, même mémoire, 2000/2000 voxels identiques.'],
      ['Pipeline ROS 2', 'Gazebo, bridge ROS 2, nœud de cartographie, tour automatique du sous-sol au toit, caméra embarquée et deux vues RViz.'],
      ['Mémoire mesurée', 'Sur 2,7 M de points LiDAR : nuage brut 32,5 Mo, carte .bt à 10 cm 6,6 Mo. C’est l’espace libre qui coûte le plus (~30 M de voxels contre 0,6 M occupés).'],
      ['Réglage du clamping', 'Le même vol rejoué avec plusieurs bornes : −1,0 au lieu de −2,0 économise 17 % de RAM avec la même précision.'],
    ], [
      ['Probabilistic map', 'Each beam marks its end point as occupied (+0.85) and the voxels it crosses as free (−0.41), in log-odds. A ghost point disappears after three beams.'],
      ['Octree & .bt format', 'A 16-level tree where eight identical leaves merge. The .bt files open in liboctomap: same node count, same memory, 2000/2000 identical voxels.'],
      ['ROS 2 pipeline', 'Gazebo, the ROS 2 bridge, a mapping node, an automatic tour from basement to roof, an onboard camera and two RViz views.'],
      ['Measured memory', 'For 2.7 M LiDAR points: raw cloud 32.5 MB, .bt map at 10 cm 6.6 MB. Free space is what costs the most (~30 M voxels vs 0.6 M occupied).'],
      ['Clamping tuning', 'The same flight replayed with several bounds: −1.0 instead of −2.0 saves 17 % of RAM with the same accuracy.'],
    ]),
    tags: ['ROS 2 Jazzy', 'Gazebo Harmonic', 'Python', 'NumPy', '3D LiDAR', 'OctoMap', 'RViz', 'pytest'],
    repo: 'https://github.com/ant-one-dev/octomap-drone-explorer',
  },
  {
    id: 'vigibot',
    title: 'Vigibot',
    subtitle: L('Robot autonome d’inspection industrielle', 'Autonomous industrial inspection robot'),
    year: '2026',
    visual: 'robot',
    cats: ['embedded', 'ai'],
    summary: L(
      'Robot sur Raspberry Pi 4 (kit Adeept PiCar-B2) conçu pour inspecter des sites industriels. Il traverse seul quatre zones : ligne infrarouge, obstacles, ligne rouge suivie à la caméra et labyrinthe guidé par des flèches. Nous avons forké le code du kit et l’avons largement réécrit en comportements modulaires et multithreadés.',
      'A Raspberry Pi 4 robot (Adeept PiCar-B2 kit) built to inspect industrial sites. It crosses four zones on its own: infrared line, obstacles, camera-tracked red line and an arrow-guided labyrinth. We forked the kit’s code and largely rewrote it around modular, multithreaded behaviours.',
    ),
    bullets: L([
      ['Suivi de ligne infrarouge', 'Réflectométrie IR sur une ligne noire, boucle de contrôle multithreadée et signalisation sonore au buzzer.'],
      ['Évitement d’obstacles', 'Mesure de distance continue aux ultrasons et manœuvres de contournement, en version multithreadée pour plus de réactivité.'],
      ['Suivi de ligne caméra', 'Segmentation HSV d’une ligne rouge dans deux régions d’intérêt. Le braquage combine position latérale et direction (65/35), avec lissage exponentiel, zone morte, anticipation des virages serrés et vitesse adaptative.'],
      ['Labyrinthe & vision', 'Reconnaissance de flèches à la caméra pour choisir la direction à chaque intersection, et détection d’objets en temps réel avec YOLO dans la dernière version.'],
      ['Machine à états & interface web', 'Transitions entre zones avec séquences de calibration matérielle, et serveur Flask embarqué (hotspot Wi-Fi) : flux vidéo en direct, démarrage/arrêt, choix de la zone et télémétrie.'],
    ], [
      ['Infrared line-following', 'IR reflectance sensing on a black line, a multithreaded control loop and buzzer signalling.'],
      ['Obstacle avoidance', 'Continuous ultrasonic ranging and avoidance manoeuvres, with a multithreaded version for faster reactions.'],
      ['Camera line-following', 'HSV segmentation of a red line in two regions of interest. The steering mixes lateral position and line direction (65/35), with exponential smoothing, a dead zone, early detection of sharp turns and adaptive speed.'],
      ['Labyrinth & vision', 'Camera recognition of arrows to pick a direction at each intersection, plus real-time object detection with YOLO in the latest version.'],
      ['State machine & web interface', 'Zone transitions with hardware calibration sequences, and an on-board Flask server (Wi-Fi hotspot): live video feed, start/stop, zone selection and telemetry.'],
    ]),
    tags: ['Python', 'OpenCV', 'YOLO', 'Flask', 'Raspberry Pi 4', 'Picamera2', 'Multithreading', 'I²C (PCA9685)', 'IR & ultrasonic'],
    repo: 'https://github.com/Sowker/Vigibot',
  },
  {
    id: 'fpga-reflex',
    title: L('Jeu de réflexes sur FPGA', 'Reflex Game on FPGA'),
    subtitle: L('Architecture matérielle synchrone sur Digilent Arty A7', 'Synchronous hardware design on a Digilent Arty A7'),
    year: '2026',
    visual: 'fpga',
    cats: ['embedded'],
    summary: L(
      'Un jeu de temps de réaction entièrement codé en VHDL : une LED s’allume au hasard et le joueur doit appuyer sur le bouton correspondant avant la fin de la fenêtre de temps.',
      'A reaction-time game written entirely in VHDL: a random LED lights up, and the player must hit the matching button before the time window closes.',
    ),
    bullets: L([
      ['Machine d’états finis', 'Séquence la logique du jeu, mesure le temps de réaction et gère les erreurs et les fenêtres de temps.'],
      ['Unité de calcul', 'Une ALU dédiée sert de générateur pseudo-aléatoire (PRNG) pour choisir la LED à allumer.'],
      ['Périphériques & audio', 'Animations lumineuses sur les LED et synthèse sonore : la sortie PMOD JC commande un transistor qui laisse passer le 5 V vers le buzzer à la fréquence voulue, la masse du buzzer étant reliée à la carte.'],
    ], [
      ['Finite state machine', 'Sequences the game logic, measures reaction time, and handles errors and time windows.'],
      ['Arithmetic unit', 'A dedicated ALU acts as a pseudo-random number generator (PRNG) to choose which LED lights up.'],
      ['Peripherals & audio', 'LED animations and sound synthesis: the PMOD JC output drives a transistor that switches 5 V to the buzzer at the chosen frequency, with the buzzer’s ground tied to the board.'],
    ]),
    tags: ['VHDL', 'FPGA', 'Arty A7 (Artix-7)', 'Vivado', 'FSM', 'ALU', 'PMOD', 'Transistor driver'],
    repo: null, // TODO: push the VHDL sources to VHDL2_project and link it here
  },
  {
    id: 'plant-disease',
    title: L('Détection de maladies des plantes', 'Plant Disease Detector'),
    subtitle: L('Diagnostic de feuilles par deep learning, servi en application web', 'Deep-learning leaf diagnosis, served as a web app'),
    year: '2025',
    visual: 'nn',
    cats: ['ai', 'software'],
    summary: L(
      'Un classifieur qui reconnaît les maladies des plantes à partir d’une photo de feuille, entraîné sur le jeu de données PlantVillage, avec des outils d’explicabilité et une application web conteneurisée.',
      'A classifier that recognises plant diseases from a photo of a leaf, trained on the PlantVillage dataset, with explainability tools and a containerised web app.',
    ),
    bullets: L([
      ['Modèle', 'Réseau convolutif sur mesure (TensorFlow/Keras, entrée 256×256, augmentation et pondération des classes) atteignant environ 98 % de précision sur le jeu de test. Des modèles de référence random forest et KNN tournent sur des features MobileNetV2.'],
      ['Explicabilité', 'Des cartes Grad-CAM, LIME et SHAP montrent quelles zones de la feuille influencent chaque prédiction.'],
      ['Déploiement', 'Service FastAPI (/predict, /models) où l’on choisit un modèle et envoie une photo, avec un front web. Toute la stack tourne avec Docker Compose.'],
    ], [
      ['Model', 'Custom convolutional network (TensorFlow/Keras, 256×256 input, augmentation and class weighting) reaching about 98% accuracy on the held-out split. Random-forest and KNN baselines run on MobileNetV2 features.'],
      ['Explainability', 'Grad-CAM, LIME and SHAP overlays show which parts of the leaf drive each prediction.'],
      ['Deployment', 'FastAPI service (/predict, /models) where users pick a model and upload a photo, with a web front end. The whole stack runs with Docker Compose.'],
    ]),
    tags: ['Python', 'TensorFlow / Keras', 'scikit-learn', 'FastAPI', 'Docker', 'Grad-CAM · LIME · SHAP'],
    repo: 'https://github.com/Vectra777/ML-Project',
  },
  {
    id: 'esp32-audiofx',
    title: 'ESP32 Audio FX',
    subtitle: L('Processeur d’effets audio Bluetooth temps réel sur ESP32', 'Real-time Bluetooth audio effects processor on ESP32'),
    year: '2026',
    visual: 'audio',
    gif: 'assets/projects/esp32-audiofx.gif?v=20261017', // vraie interface, generee par le code du firmware
    cats: ['embedded', 'audio'],
    summary: L(
      'L’ESP32 reçoit la musique d’un téléphone en Bluetooth, la fait passer dans une chaîne de 15 effets réordonnable et la ressort en I2S 32 bits sur un DAC PCM5102. Un écran ST7735 affiche des menus colorés et animés ainsi que le spectre FFT du signal de sortie, et quatre potentiomètres règlent les effets en direct.',
      'The ESP32 receives music from a phone over Bluetooth, runs it through a reorderable chain of 15 effects and outputs it as 32-bit I2S on a PCM5102 DAC. An ST7735 screen shows colourful animated menus and the FFT spectrum of the output, and four potentiometers tweak the effects live.',
    ),
    bullets: L([
      ['15 effets + Master', 'Filtres passe-bas, passe-haut et passe-bande résonants avec LFO, EQ 3 bandes, compresseur, distorsion (4 courbes), bitcrusher, ring mod, tremolo, autopan, phaser, flanger, chorus, delay ping-pong et reverb Freeverb, puis un master avec limiteur.'],
      ['Temps réel sur deux cœurs', 'Bluetooth A2DP sur un cœur, traitement flottant par blocs de 128 trames sur l’autre (~9 % de CPU), tampon anti-gigue de 32 Ko et lignes à retard en PSRAM. Fondu de 30 ms à l’activation pour éviter les clics.'],
      ['Architecture objet', 'Chaque effet est une classe enfant d’une classe parent qui gère les paramètres (linéaire, log, entier, choix), la prise en main des potentiomètres et sa page d’écran animée.'],
      ['Interface & analyseur', 'Carrousel, transitions et boutons rotatifs animés à ~33 fps, FFT 1024 points avec fenêtre de Hann sur 40 bandes logarithmiques, métadonnées et commandes AVRCP.'],
      ['Documentation', 'Un document LaTeX explique chaque effet : principe, équations, schéma-bloc et mesures obtenues en exécutant le vrai code des effets.'],
    ], [
      ['15 effects + Master', 'Resonant low-pass, high-pass and band-pass filters with LFO, 3-band EQ, compressor, distortion (4 curves), bitcrusher, ring mod, tremolo, autopan, phaser, flanger, chorus, ping-pong delay and Freeverb reverb, followed by a master stage with a limiter.'],
      ['Real time on two cores', 'Bluetooth A2DP on one core, floating-point processing in 128-frame blocks on the other (~9% CPU), a 32 KB jitter buffer and delay lines in PSRAM. 30 ms crossfades on bypass avoid clicks.'],
      ['Object-oriented design', 'Each effect is a child class of a parent class that handles parameters (linear, log, integer, choice), potentiometer pickup and its own animated screen page.'],
      ['UI & analyser', 'Carousel, transitions and animated knobs at ~33 fps, a 1024-point FFT with a Hann window over 40 log bands, plus AVRCP metadata and controls.'],
      ['Documentation', 'A LaTeX document explains every effect: principle, equations, block diagram and measurements made by running the actual effect code.'],
    ]),
    tags: ['C++17', 'ESP32', 'PlatformIO', 'FreeRTOS', 'Bluetooth A2DP', 'I2S', 'DSP', 'FFT', 'TFT ST7735', 'PCM5102'],
    repo: 'https://github.com/ant-one-dev/esp32-audiofx',
  },
  {
    id: 'modulationlab',
    title: 'ModulationLab',
    subtitle: L('Laboratoire interactif de communications numériques sous MATLAB', 'Interactive digital communications lab in MATLAB'),
    year: '2026',
    visual: 'comms',
    gif: 'assets/projects/modulationlab.gif?v=20261026b', // La Joconde reçue avec 5 modulations x 4 codages quand le bruit augmente
    cats: ['embedded', 'software'],
    summary: L(
      'Une application MATLAB qui simule une chaîne de transmission numérique complète : CRC, code correcteur, codage de ligne ou modulation, canal à bruit blanc gaussien, puis démodulation, décodage et vérification. Tout est codé à la main, sans toolbox, et le taux d’erreur simulé de chaque schéma est vérifié contre la théorie.',
      'A MATLAB app that simulates a complete digital transmission chain: CRC, error-correcting code, line coding or modulation, an additive white Gaussian noise channel, then demodulation, decoding and checking. Everything is written by hand with no toolbox, and the simulated error rate of every scheme is checked against theory.',
    ),
    bullets: L([
      ['23 schémas', 'NRZ, RZ, Manchester, AMI et 2B1Q en bande de base ; OOK, BASK, M-ASK et M-PSK avec M au choix, FSK non cohérente, 16/64-QAM et 16/32-APSK avec les rapports d’anneaux du DVB-S2.'],
      ['Codage canal', 'CRC-8 et CRC-16, Hamming (7,4) par syndrome, codes convolutifs K=3 et K=7 avec un décodeur de Viterbi. L’Eb/N0 est compté par bit d’information pour mesurer le vrai gain de codage : environ 3 dB pour K=7 en QPSK à 10⁻⁴.'],
      ['Interface en temps réel', 'Un seul écran : bits alignés sur la porteuse modulée, constellation, diagramme de l’œil, densité spectrale avec la bande à 99 %, courbes de TEB superposables, et La Joconde transmise en couleur pour voir les erreurs.'],
      ['Validé contre la théorie', 'Une suite de tests lancée par GitHub Actions vérifie les valeurs de contrôle des CRC, les décodeurs, le codage de Gray et un TEB simulé à moins de 15 % de la théorie pour chaque schéma.'],
      ['Ce que montrent les mesures', 'Sur 47 000 trames très bruitées, le CRC-8 a laissé passer environ 1 trame corrompue sur 240, le CRC-16 aucune. Sans entrelacement, Hamming dégrade la 4-FSK, dont les erreurs arrivent par paires.'],
    ], [
      ['23 schemes', 'NRZ, RZ, Manchester, AMI and 2B1Q in baseband; OOK, BASK, M-ASK and M-PSK with a selectable M, non-coherent FSK, 16/64-QAM and 16/32-APSK with DVB-S2 ring ratios.'],
      ['Channel coding', 'CRC-8 and CRC-16, syndrome-decoded Hamming (7,4), K=3 and K=7 convolutional codes with a Viterbi decoder. Eb/N0 is counted per information bit to measure the real coding gain: about 3 dB for K=7 on QPSK at 10⁻⁴.'],
      ['Real-time interface', 'One screen: bits aligned with the modulated carrier, constellation, eye diagram, power spectral density with the 99% band, overlaid BER curves, and the Mona Lisa sent in colour to see the errors.'],
      ['Checked against theory', 'A test suite run by GitHub Actions checks the CRC check values, the decoders, the Gray mapping and a simulated BER within 15% of theory for every scheme.'],
      ['What the measurements show', 'Over 47,000 heavily corrupted frames, CRC-8 let about 1 in 240 slip through and CRC-16 none. Without interleaving, Hamming makes 4-FSK worse because its errors come in pairs.'],
    ]),
    tags: ['MATLAB', 'Digital modulation', 'Channel coding', 'Viterbi', 'CRC', 'AWGN', 'DSP', 'GitHub Actions'],
    repo: 'https://github.com/ant-one-dev/ModulationLab',
  },
];

// Project cards. cats are used by the filter buttons.
// art: generated illustration ('marauder' is an animated map).
// status: 'wip' for projects not published yet.
export const projects = [
  {
    title: 'AutomateDFA Manager',
    year: '2025',
    cats: ['software'],
    art: 'automata',
    desc: L(
      'Application Java Swing pour le cours de langages formels : édition de plusieurs automates en parallèle, graphe rendu en direct avec Graphviz, et transformations en un clic (déterminiser, compléter, standardiser, complémenter, minimiser), avec export PNG/PDF et tests de reconnaissance de mots.',
      'Java Swing application for the formal-languages course: edit several automata side by side, see the graph rendered live with Graphviz, and apply transformations in one click (determinise, complete, standardise, complement, minimise), with PNG/PDF export and word recognition tests.',
    ),
    tags: ['Java 17', 'Swing', 'Graphviz', 'Maven', 'Automata theory'],
    repo: null, // private repo: ant-one-dev/Automate2.0
  },
  {
    title: 'ICE-Box 2000',
    year: '2026',
    cats: ['embedded', 'audio'],
    img: 'assets/projects/icebox-2000.webp?v=20261017',
    imgBg: 'linear-gradient(180deg, #323d49 0%, #323e49 62%, #343f4e 64%, #3e4756 67%, #434e5f 69%, #4a5566 73%, #4b5667 85%, #444f60 100%)', // fond du rendu 3D
    desc: L(
      'Juke-box conçu pour l’association ICE EFREI : on pose sur le lecteur RFID une carte imprimée avec une pochette d’album, et le Raspberry Pi lance la musique correspondante sur le système audio. J’ai dessiné tout le boîtier dans Fusion 360, au millimètre près, pour y faire rentrer le Raspberry Pi, le lecteur RFID et l’électronique audio.',
      'A jukebox designed for the ICE EFREI association: place a printed card showing an album cover on the RFID reader and the Raspberry Pi plays the matching music through the audio system. I designed the whole enclosure in Fusion 360, down to the millimetre, so that the Raspberry Pi, the RFID reader and the audio electronics fit inside.',
    ),
    tags: ['Python', 'Raspberry Pi', 'RFID', 'Audio', 'Fusion 360'],
    repo: null,
  },
  {
    title: L('Traducteur Morse sur ESP32', 'ESP32 Morse Code Translator'),
    year: '2026',
    cats: ['embedded'],
    art: 'morse',
    desc: L(
      'Saisie Morse par bouton-poussoir décodée en texte en temps réel sur un ESP32, avec retour sonore au buzzer, affichage sur écran TFT SPI (ST7735), anti-rebond logiciel et seuils de temps configurables.',
      'Push-button Morse input decoded to text in real time on an ESP32, with buzzer feedback, an SPI TFT display (ST7735), software debouncing and configurable timing thresholds.',
    ),
    tags: ['C++', 'ESP32', 'PlatformIO', 'SPI', 'TFT ST7735'],
    repo: 'https://github.com/ant-one-dev/ESP32-Morse-Code-Translator',
  },
  {
    title: 'Image → Oscilloscope',
    year: '2026',
    cats: ['embedded', 'audio'],
    art: 'scope',
    desc: L(
      'Convertit images, GIF et vidéos en un signal WAV stéréo qui les dessine sur un oscilloscope en mode XY (canal gauche = X, droit = Y). Extraction de contours, sortie jusqu’à 192 kHz, modes d’animation et interface PyQt avec aperçu en direct.',
      'Turns images, GIFs and videos into a stereo WAV signal that draws them on an oscilloscope in XY mode (left channel = X, right = Y). Contour extraction, up to 192 kHz output, animation modes, and a PyQt GUI with a live preview.',
    ),
    tags: ['Python', 'OpenCV', 'NumPy', 'Signal processing', 'PyQt6'],
    repo: null,
  },
  {
    title: 'Eye-Touch',
    year: '2026',
    cats: ['ai'],
    art: 'eye',
    desc: L(
      'Interface pilotée au regard. MediaPipe Face Mesh suit les yeux, une calibration en 5 points projette le regard sur l’écran par homographie, et une moyenne glissante combinée à un lissage exponentiel stabilise le curseur. Les objets sélectionnés contournent les obstacles grâce à A*.',
      'Hands-free interface controlled by gaze. MediaPipe Face Mesh tracks the eyes, a 5-point calibration maps gaze to the screen with a homography, and a moving average plus EMA steadies the cursor. Selected objects find their way around obstacles with A*.',
    ),
    tags: ['Python', 'MediaPipe', 'OpenCV', 'Pygame', 'A*'],
    repo: null,
  },
  {
    title: 'Metallizer',
    year: '2025',
    cats: ['audio'],
    art: 'wave',
    desc: L(
      'Plugin audio en C++ avec JUCE : une distorsion par repliement d’onde (wavefolding) autour d’un seuil réglable, avec compensation automatique du niveau et mélange dry/wet.',
      'Audio plugin written in C++ with JUCE: a wavefolding distortion that mirrors the signal around an adjustable threshold, with automatic level compensation and a dry/wet mix.',
    ),
    tags: ['C++', 'JUCE', 'DSP', 'Audio plugin'],
    repo: null,
  },
  {
    title: 'Marauder Map',
    year: '2025',
    cats: ['software'],
    art: 'marauder',
    desc: L(
      'Application Android pour aider les associations à coordonner leurs maraudes auprès des personnes sans abri. Les bénévoles se connectent, voient les zones d’intervention sur une carte, rejoignent ou créent des maraudes depuis un calendrier et saisissent bénévoles, durée et dons pour chacune.',
      'Android app that helps charities coordinate their street outreach rounds for people experiencing homelessness. Volunteers sign in, see the outreach zones on a map, join or create rounds from a calendar, and log volunteers, duration and donations for each one.',
    ),
    tags: ['Kotlin', 'Jetpack Compose', 'MVVM', 'Firebase', 'Google Maps SDK'],
    repo: null,
  },
  {
    title: 'YoStream',
    year: '2024',
    cats: ['software'],
    art: 'stream',
    desc: L(
      'Application mobile de streaming de films en React Native (Expo) : connexion, accueil en carrousels, catalogue avec recherche et filtres par genre, fiche film avec bande-annonce, lecteur vidéo plein écran, favoris et paramètres. Données et comptes sur Supabase, notifications push avec Firebase Cloud Messaging.',
      'Mobile movie-streaming app in React Native (Expo): sign-in, a home screen of carousels, a catalogue with search and genre filters, a movie page with its trailer, a full-screen video player, favourites and settings. Data and accounts on Supabase, push notifications with Firebase Cloud Messaging.',
    ),
    tags: ['React Native', 'Expo', 'TypeScript', 'Supabase', 'Firebase Messaging'],
    repo: null,
  },
  {
    title: 'TODO · Competence Tracker',
    year: '2025',
    cats: ['software'],
    art: 'kanban',
    desc: L(
      'Application web full-stack de suivi des compétences en entreprise : équipes, employés et compétences avec fichiers joints et descriptions en Markdown, vues Kanban, liste et calendrier, authentification par cookies et notifications par e-mail. J’ai travaillé côté serveur (modèles Sequelize, contrôleurs, routes, gestion multi-entreprises) et côté front (formulaire de tâche, glisser-déposer synchronisé avec la base, pages d’accueil et de connexion).',
      'Full-stack web app for tracking skills within a company, with teams, employees and competencies with attached files and Markdown descriptions, Kanban, list and calendar views, cookie-based authentication and e-mail notifications. I worked on the server (Sequelize models, controllers, routes, multi-company support) and the front end (task form, drag and drop synced with the database, home and login pages).',
    ),
    tags: ['Vue.js 3', 'Pinia', 'Node.js', 'Express', 'Sequelize', 'MySQL', 'Docker'],
    repo: 'https://github.com/Vectra777/todoSystem',
  },
  {
    title: 'ArtConnect Pro',
    year: '2026',
    cats: ['software'],
    art: 'erd',
    desc: L(
      'Application JavaFX de gestion d’une communauté artistique locale (artistes, œuvres, expositions, galeries, ateliers), en architecture en couches. J’ai conçu une grande partie de la base MySQL : schéma, procédures stockées et fonctions, rôles et privilèges par type d’utilisateur, puis les DAO JDBC, la connexion/inscription et les vues mises à jour en temps réel.',
      'JavaFX app for managing a local art community (artists, artworks, exhibitions, galleries, workshops), with a layered architecture. I designed much of the MySQL side: schema, stored procedures and functions, roles and privileges per user type, then the JDBC DAOs, login/register and views that update in real time.',
    ),
    tags: ['Java 17', 'JavaFX', 'JDBC', 'MySQL', 'SQL procedures', 'DAO'],
    repo: null,
  },
  {
    title: L('Pathfinding du rover MARC', 'MARC Rover Pathfinding'),
    year: '2024',
    cats: ['software'],
    art: 'rover',
    desc: L(
      'En C : un rover martien trouve le chemin le moins coûteux pour rejoindre sa base sur une carte de coûts, en construisant et en explorant un arbre de déplacements possibles, avec un travail sur la complexité en temps et en mémoire.',
      'Written in C: a Mars rover finds the cheapest route back to its base on a cost map by building and exploring a tree of possible moves, with work on time and memory complexity.',
    ),
    tags: ['C', 'Trees', 'Pathfinding', 'Complexity'],
    repo: null,
  },
  {
    title: 'Graph Theory Studio',
    year: '2026',
    cats: ['software'],
    art: 'hanoi',
    desc: L(
      'Application de bureau pour modéliser des graphes orientés pondérés à partir d’une syntaxe texte, avec rendu en direct, Floyd-Warshall (matrices pas à pas, détection de circuits absorbants) et Dijkstra. Exemple d’application : une migration de serveurs entre baies modélisée comme les tours de Hanoï. Chaque état est un sommet, chaque déplacement valide un arc, et l’algorithme trouve le nombre minimal de déplacements.',
      'Desktop app for modelling directed weighted graphs from a text syntax, with live rendering, Floyd-Warshall (step-by-step matrices, absorbing-cycle detection) and Dijkstra. Application example: a server migration between racks modelled as the Towers of Hanoi. Each state is a vertex, each valid move an edge, and the algorithm finds the minimum number of moves.',
    ),
    tags: ['Python', 'PyQt5', 'PyVis', 'Floyd-Warshall', 'Dijkstra', 'Towers of Hanoi'],
    repo: 'https://github.com/ant-one-dev/Graph-Theory',
  },
  {
    title: 'CDataframe',
    year: '2024',
    cats: ['software'],
    art: 'table',
    desc: L(
      'Une bibliothèque de dataframes façon pandas écrite en C : colonnes typées, insertion, tri et recherche, import/export CSV.',
      'A pandas-style dataframe library written in C: typed columns, insertion, sorting and search, and CSV import/export.',
    ),
    tags: ['C', 'Data structures', 'Memory management'],
    repo: null,
  },
  {
    title: 'Hoot-Hoot Adventure',
    year: '2024',
    cats: ['software'],
    art: 'owl',
    desc: L(
      'Jeu de plateforme en Pygame avec un moteur physique fait main. On lance la chouette au lance-pierre sur une trajectoire parabolique. Les blocs de glace la font glisser, les blocs de gravité la font tomber vers le haut, et chaque choc la fait rebondir et lui coûte de l’énergie. Huit niveaux, des ennemis et un éditeur de niveaux.',
      'Platform game in Pygame with a hand-made physics engine. You launch the owl from a slingshot along a parabolic path. Ice blocks make it slide, gravity blocks make it fall upwards, and every hit bounces it and costs it energy. Eight levels, enemies and a level editor.',
    ),
    tags: ['Python', 'Pygame', 'Physics engine', 'Level editor'],
    repo: null,
  },
  {
    title: L('Éditeur d’images en Rust', 'Rust Image Editor'),
    year: '2025',
    cats: ['software'],
    art: 'image',
    desc: L(
      'Éditeur d’images écrit en Rust avec eframe/egui, qui transforme les images à l’aide d’une série de filtres.',
      'Image editor written in Rust with eframe/egui that transforms images through a set of filters.',
    ),
    tags: ['Rust', 'eframe', 'egui', 'Image processing'],
    repo: 'https://github.com/ant-one-dev/image-editor',
  },
];

// Skill stack, top (software) → bottom (silicon).
export const stack = [
  { layer: L('Logiciel & applications', 'Software & Apps'), code: 'L6', color: '#8b7bff',
    items: ['Python', 'Java', 'Rust', 'Kotlin', 'SQL', 'FastAPI', 'Flask', 'Firebase', 'Docker'] },
  { layer: L('Vision & IA embarquée', 'Vision & Edge AI'), code: 'L5', color: '#ff5c8a',
    items: ['OpenCV', 'YOLO', 'TensorFlow / Keras', 'MediaPipe', 'scikit-learn', 'Matlab / Simulink'] },
  { layer: L('Linux embarqué & robotique', 'Embedded Linux & Robotics'), code: 'L4', color: '#4ade80',
    items: ['ROS 2', 'Gazebo', 'LiDAR', 'Raspberry Pi', 'Linux', 'Picamera2', L('Capteurs & actionneurs', 'Sensors & actuators'), 'Git'] },
  { layer: L('Bus & protocoles', 'Buses & Protocols'), code: 'L3', color: '#ffd166',
    items: ['UART', 'I²C', 'SPI', 'CAN', 'MQTT', 'Bluetooth'] },
  { layer: L('Firmware & microcontrôleurs', 'Firmware & MCUs'), code: 'L2', color: '#3ee6ff',
    items: ['C', 'C++', 'ESP32', 'ARM', 'RTOS', 'Arduino', 'PlatformIO'] },
  { layer: L('Matériel & signal', 'Hardware & Signal'), code: 'L1', color: '#e2a052',
    items: ['VHDL', 'FPGA', 'Vivado', L('Machines à états', 'FSM design'), L('Électronique', 'Electronics'), 'DSP / audio (JUCE)'] },
];

// Logos of the schools and companies (files in assets/logos, © their owners).
// logoStrip: order of the scrolling band in the Journey section.
export const logos = {
  efrei: { src: 'assets/logos/efrei.svg', name: 'EFREI Paris' },
  concordia: { src: 'assets/logos/concordia.svg', name: 'Concordia University' },
  darty: { src: 'assets/logos/darty.svg', name: 'Darty' },
  carrefour: { src: 'assets/logos/carrefour-city.svg', name: 'Carrefour City', light: true }, // pale logo: darker in grayscale
  saintdo: { src: 'assets/logos/saint-dominique.png', name: 'Institution Saint-Dominique' },
  academica: { src: 'assets/logos/academica.png', name: 'Academica Dual Diploma' },
  ambassadair: { src: 'assets/logos/ambassadair.png', name: 'Ambassadair Academy' },
  sfe: { src: 'assets/logos/sfe.jpg', name: 'Solidarity For Earth (SFE)' },
  ice: { src: 'assets/logos/ice-efrei.png', name: 'ICE EFREI' },
};
export const logoStrip = ['efrei', 'ice', 'concordia', 'sfe', 'darty', 'carrefour', 'saintdo', 'academica', 'ambassadair'];

// type: 'edu' | 'work' | 'asso' | 'award' | 'next'
// logo: key of `logos`, or icon: 'next' | 'chip' | 'trophy' when there is no official logo
export const timeline = [
  { date: L('nov. 2026 → avr. 2027', 'Nov 2026 → Apr 2027'), type: 'next', icon: 'next',
    title: L('Stage ingénieur embarqué', 'Embedded engineering internship'), org: L('Votre entreprise ?', 'Your company?'),
    desc: L('Stage de M1 de 5 mois, du 2 novembre 2026 au 2 avril 2027. Logiciel embarqué, FPGA, robotique ou drones.',
      '5-month M1 internship from 2 November 2026 to 2 April 2027. Embedded software, FPGA, robotics or drones.') },
  { date: '2026 – 2027', type: 'asso', logo: 'ice',
    title: L('Vice-président', 'Vice-President'), org: L('ICE EFREI (association technologique) · Paris', 'ICE EFREI (tech association) · Paris'),
    desc: L('Animation d’ateliers techniques (impression 3D, Arduino, Raspberry Pi) et accompagnement des étudiants dans leurs projets électroniques.',
      'Run hands-on workshops (3D printing, Arduino, Raspberry Pi) and mentor students on their electronics projects.') },
  { date: L('en cours', 'ongoing'), type: 'asso', logo: 'sfe', // TODO: add the start date
    title: L('Responsable technique', 'Technical lead'), org: 'Solidarity For Earth (SFE)',
    desc: L('Responsable technique de l’association SFE (Solidarity For Earth), fondée par Céleste Mazure.',
      'Technical lead of the SFE association (Solidarity For Earth), founded by Céleste Mazure.') },
  { date: '2025 – 2026', type: 'award', logo: 'efrei',
    title: L('Major de promotion', 'Top of class'), org: 'EFREI Paris',
    desc: L('Classé premier de ma promotion pour l’année 2025–2026.', 'Ranked first in my class for the 2025–2026 academic year.') },
  { date: L('août – déc. 2025', 'Aug – Dec 2025'), type: 'edu', logo: 'concordia',
    title: L('Semestre d’échange', 'Academic exchange semester'), org: L('Concordia University · Montréal, Canada', 'Concordia University · Montréal, Canada'),
    desc: L('Semestre d’échange universitaire au Canada.', 'International exchange semester in Canada.') },
  { date: '2025', type: 'award', icon: 'trophy',
    title: 'Masterdev France', org: L('Épreuve nationale de programmation', 'National programming competition'),
    desc: L('Participation au concours national de programmation.', 'Took part in the French national programming contest.') },
  { date: '2024 – 2025', type: 'award', logo: 'efrei',
    title: L('Deuxième de promotion', 'Ranked 2nd in class'), org: 'EFREI Paris',
    desc: L('Classé deuxième de ma promotion pour l’année 2024–2025.', 'Ranked second in my class for the 2024–2025 academic year.') },
  { date: L('janv. 2025', 'Jan 2025'), type: 'work', logo: 'darty',
    title: L('Vendeur conseil en produits techniques', 'Technical sales advisor'), org: 'Darty des Ternes · Paris',
    desc: L('Vente et explication technique d’équipements électroniques grand public, réapprovisionnement du rayon et mise à jour des prix.',
      'Advised customers on consumer electronics and explained them technically; restocked the department and updated prices.') },
  { date: L('juin 2024', 'Jun 2024'), type: 'work', logo: 'carrefour',
    title: L('Stage de manutention & logistique', 'Logistics internship'), org: 'Carrefour City · Neuilly-sur-Seine',
    desc: L('Réception des livraisons, mise en rayon et gestion des stocks en réserve.', 'Received deliveries, stocked shelves and managed back-room inventory.') },
  { date: '2023 – 2024', type: 'award', logo: 'efrei',
    title: L('Major de promotion', 'Top of class'), org: 'EFREI Paris',
    desc: L('Classé premier de ma promotion dès ma première année, en 2023–2024.', 'Ranked first in my class in my first year, 2023–2024.') },
  { date: '2023 – 2028', type: 'edu', logo: 'efrei',
    title: L('Diplôme d’ingénieur du numérique', 'Master of Engineering (Diplôme d’Ingénieur)'), org: L('EFREI Paris – Université Panthéon-Assas', 'EFREI Paris – Panthéon-Assas University'),
    desc: L('Parcours Systèmes Embarqués, majeure Robotique & Drones. Section internationale, 100 % des cours en anglais.',
      'Embedded Systems track, majoring in Robotics & Drones. International section, 100% of courses taught in English.') },
  { date: '2023', type: 'edu', logo: 'saintdo',
    title: L('Baccalauréat général, mention Très Bien', 'French Baccalauréat, highest honours'), org: 'Lycée Saint-Dominique',
    desc: L('Mathématiques et Physique-Chimie. Mention Très Bien avec félicitations du jury.',
      'Mathematics and Physics-Chemistry. Mention Très Bien with the jury’s congratulations.') },
  { date: '2020 – 2021', type: 'edu', logo: 'ambassadair',
    title: L('Brevet d’Initiation à l’Aéronautique (BIA)', 'Aeronautics Initiation Certificate (BIA)'), org: 'Ambassadair',
    desc: L('Aérodynamique, connaissance des aéronefs, météorologie et navigation aérienne.',
      'French certificate covering aerodynamics, aircraft systems, meteorology and air navigation.') },
  { date: '2019 – 2023', type: 'edu', logo: 'academica',
    title: L('High School Diploma américain', 'American High School Diploma'), org: 'Academica Dual Diploma',
    desc: L('Double diplôme obtenu en parallèle du baccalauréat.', 'US diploma earned alongside the French baccalauréat.') },
];
