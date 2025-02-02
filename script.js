document.getElementById("background-btn").addEventListener("click", () => {
  const backgrounds = [
    { name: "Motif Orange - Diamants", class: "bg-pattern1" },
    { name: "Motif Bordeaux - Points", class: "bg-pattern2" },
    { name: "Motif Bleu - Vagues", class: "bg-pattern3" },
    { name: "Motif Vert - Feuilles", class: "bg-pattern4" },
    { name: "Motif Violet - Étoiles", class: "bg-pattern5" }
  ];

  const options = backgrounds.map((bg, index) => 
    `${index + 1}. ${bg.name}`
  ).join("\n");

  const choice = prompt(
    `Choisissez un fond :\n${options}\n\nEntrez le numéro :`
  );

  if (choice && choice >= 1 && choice <= backgrounds.length) {
    const gameDiv = document.getElementById("game");
    gameDiv.className = ''; // Réinitialiser les classes
    gameDiv.classList.add(backgrounds[choice - 1].class);
  } else {
    alert("Option invalide !");
  }
});

let isPlayerTurn = true; // Indique si c'est au tour du joueur d'attaquer
// Ajouter ces variables au début du fichier
let isOpponentParalyzed = false;
let thunderCageUsed = false;
// Initialisation des stats
const pokemonStats = {
    Pikachu: { hp: 492 },
    Salamèche: { hp: 500 },
  };

const typeChart = {
  Feu: { Feu: 0.5, Electrik: 1, Normal: 1 },
  Electrik: { Feu: 1, Electrik: 0.5, Normal: 1 },
  Normal: { Feu: 1, Electrik: 1, Normal: 1 },
};

// Nouveau compteur pour Reflet
let reflectCountOnOpponent = 0;
const reflectMultipliers = [1, 0.9, 0.8, 0.7, 0.6];

const attacks = {
  Pikachu: {
    "Étincelle": { damage: 65, type: "Electrik", accuracy: 100 },
    "Cage-Éclair": { isSupport: true, accuracy: 90 },
    Reflet: { isSupport: true, accuracy: 100 },
    "Fatal-Foudre": { damage: 110, type: "Electrik", accuracy: 70 },
  },
  Salamèche: {
    "Feu d'Enfer": { damage: 100, type: "Feu", accuracy: 50 },
    Ultimapoing: { damage: 80, type: "Normal", accuracy: 85 },
    "Crocs Feu": { damage: 65, type: "Feu", accuracy: 95 },
    Rugissement: { isSupport: true, accuracy: 100, reducePercent: 20 },
  },
};

const pokemonType = {
  Pikachu: "Electrik",
  Salamèche: "Feu",
};

// Déclarer les pokémon actifs
const player = "Pikachu";
const opponent = "Salamèche";

// Ajuster les PV selon les pokémon (optionnel si vous souhaitez personnaliser)
let hp1 = pokemonStats[player].hp;
let hp2 = pokemonStats[opponent].hp;

// Compteur pour les rugissements subis par le joueur
let roarCountOnPlayer = 0;
const roarMultipliers = [1, 0.67, 0.5, 0.4, 0.33];

const log = document.getElementById("log");
const attackButtons = document.querySelectorAll(".attack-btn");

function updateHP() {
  const hpBarInner1 = document.getElementById("hp-bar-inner1");
  const hpBarInner2 = document.getElementById("hp-bar-inner2");
  const hp1Percent = (hp1 / pokemonStats[player].hp) * 100;
  const hp2Percent = (hp2 / pokemonStats[opponent].hp) * 100;

  hpBarInner1.style.width = `${hp1Percent}%`;
  hpBarInner1.style.backgroundColor = getHPColor(hp1Percent);
  hpBarInner2.style.width = `${hp2Percent}%`;
  hpBarInner2.style.backgroundColor = getHPColor(hp2Percent);

  // Modification ici pour afficher les PV actuels au lieu du pourcentage
  document.getElementById("hp1-pct").textContent = `${Math.floor(hp1)}/${pokemonStats[player].hp}`;
  document.getElementById("hp2-pct").textContent = `${Math.floor(hp2)}/${pokemonStats[opponent].hp}`;
}

function getHPColor(percentage) {
    if (percentage > 50) {
      return "#4caf50"; // Vert
    } else if (percentage > 20) {
      return "#ffc107"; // Orange
    } else {
      return "#f44336"; // Rouge
    }
}  

function addLog(message, targetName = null, targetHP = null) {
    if (targetName !== null && targetHP < 0) {
        message += ` (${targetName} : 0 PV restants)`;
    }
    if (targetName !== null && targetHP !== null && targetHP >= 0) {
        message += ` (${targetName} : ${targetHP} PV restants)`;
    }
    
    // Ajouter le nouveau message sans supprimer l'historique
    log.innerHTML += `<p>${message}</p>`;
    
    // Défilement automatique vers le bas
    log.scrollTop = log.scrollHeight;
}

// Récupérer les éléments audio
const backgroundMusic = document.getElementById("background-music");
const attackSound = document.getElementById("attack-sound");
const victoryMusic = document.getElementById("victory-music");
const musicBtn = document.getElementById("music-btn");

// Lancer la musique au début du combat
backgroundMusic.play().catch((err) => {
  console.log("Lecture automatique bloquée, musique en attente : ", err);
});

// Activer/désactiver la musique via le bouton
musicBtn.addEventListener("click", () => {
  const musicFiles = ["audio/default.mp3", "audio/battle1.mp3", "audio/battle2.mp3"];
  const selectedMusic = prompt(
    "Choisissez une musique parmi les options suivantes :\n1. Default\n2. Battle 1\n3. Battle 2\n\nEntrez le numéro :"
  );
  
  if (selectedMusic >= 1 && selectedMusic <= musicFiles.length) {
    backgroundMusic.src = musicFiles[selectedMusic - 1];
    backgroundMusic.play();
  } else {
    alert("Option invalide !");
  }
});

// Jouer un son à chaque attaque
function playAttackSound(attackName) {
  let sound;
  if (attackName === 'Fatal-Foudre') {
    sound = document.getElementById("fatal-foudre-sound");
  } else if (attackName === "Feu d'Enfer") {
    sound = document.getElementById("fire-blast-sound");
  } else {
    sound = document.getElementById("attack-sound");
  }
  sound.currentTime = 0;
  sound.play();
}

function playVictoryMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  victoryMusic.play();
}

function animateAttack(attackerImg, attackName) {
  playAttackSound(attackName);
  
  let animationClass = '';
  let effectImage = null;
  let defenderImg = attackerImg.id === "pokemon1-img" ? 
    document.getElementById("pokemon2-img") : 
    document.getElementById("pokemon1-img");

  switch (attackName) {
    case 'Fatal-Foudre':
      animationClass = 'fatal-foudre-animation';
      effectImage = document.getElementById("thunder-image");
      break;
    case "Feu d'Enfer":
      animationClass = 'fire-blast-animation';
      effectImage = document.getElementById("fire-image");
      break;
    default:
      animationClass = 'attack-animation';
  }

  if (effectImage) {
    effectImage.style.display = 'block';
    const rect = defenderImg.getBoundingClientRect();
    
    // Ajuster la position pour centrer l'effet
    if (attackName === "Feu d'Enfer") {
      effectImage.style.top = `${rect.top}px`;
      effectImage.style.left = `${rect.left}px`;
      effectImage.style.width = `${rect.width}px`;
      effectImage.style.height = `${rect.height}px`;
    } else {
      effectImage.style.top = `${rect.top}px`;
      effectImage.style.left = `${rect.left}px`;
    }
    
    setTimeout(() => {
      effectImage.style.display = 'none';
    }, 800);
  }

  attackerImg.classList.add(animationClass);
  setTimeout(() => {
    attackerImg.classList.remove(animationClass);
  }, 500);
}

function getEffectiveness(attackType, defenderType) {
  const chart = typeChart[attackType] || {};
  return chart[defenderType] !== undefined ? chart[defenderType] : 1;
}

const reflectButton = document.querySelector(".attack-btn[data-attack='Reflet']");

function applyAttack(attacker, defender, attackName) {
  const atkData = attacks[attacker][attackName];
  if (!atkData) return 0;

  // Gestion de Reflet
  if (atkData.isSupport && attackName === "Reflet") {
    if (reflectCountOnOpponent >= 4) {
      return null; // Retourne null pour une attaque invalide
    }
    reflectCountOnOpponent++;
    addLog(`${attacker} utilise Reflet !`);
    addLog(`Reflet est actif (Utilisation : ${reflectCountOnOpponent})`);

    if (reflectCountOnOpponent >= 4) {
      reflectButton.disabled = true;
      reflectButton.style.opacity = "0.5";
      reflectButton.style.cursor = "not-allowed";
    }
    return -1;
  }

  // Gestion de Cage-Éclair
  if (atkData.isSupport && attackName === "Cage-Éclair") {
    if (thunderCageUsed) {
      return null;
    }
    const hitChance = Math.floor(Math.random() * 100) + 1;
    if (hitChance <= atkData.accuracy) {
      thunderCageUsed = true;
      isOpponentParalyzed = true;
      const thunderCageButton = document.querySelector('.attack-btn[data-attack="Cage-Éclair"]');
      thunderCageButton.disabled = true;
      thunderCageButton.style.opacity = "0.5";
      thunderCageButton.style.cursor = "not-allowed";
      addLog(`${attacker} utilise Cage-Éclair !`);
      addLog(`${defender} est paralysé !`);
      return -1;
    }
    return 0;
  }

  // Calcul de précision avec Reflet
  let hitThreshold = atkData.accuracy;
  // Réduit la précision de l’adversaire si Reflet est actif
  if (defender === player && reflectCountOnOpponent > 0) {
    hitThreshold *= reflectMultipliers[reflectCountOnOpponent];
  }

  const hitChance = Math.floor(Math.random() * 100) + 1;
  if (hitChance > hitThreshold) {
    return 0;
  }

  // Base damage (exemple simplifié : on ne combine pas la stat d'attaque ici)
  let damage = atkData.damage;

  // Multiplicateur de type
  const multiplier = getEffectiveness(atkData.type, pokemonType[defender]);
  damage *= multiplier;

  // Si l'attaquant est le joueur et qu'il a subi Rugissement, on applique le multiplicateur
  if (attacker === player) {
    damage *= roarMultipliers[roarCountOnPlayer];
  }
  return Math.floor(damage);
}

let turnCount = 0;
let lastFailedAttack = null;

function opponentAttack() {
    if (hp1 <= 0 || isPlayerTurn) return; // Bloque si Pikachu est déjà vaincu ou si ce n'est pas le tour de l'adversaire

    // Vérifier la paralysie
    if (isOpponentParalyzed) {
      const paralysisCheck = Math.random() * 100;
      if (paralysisCheck <= 25) {
        addLog(`${opponent} est paralysé et ne peut pas attaquer !`);
        isPlayerTurn = true;
        attackButtons.forEach(b => b.disabled = false);
        return;
      }
    }

    turnCount++;

    // Désactive les boutons d'attaque pendant le tour de l'adversaire
    attackButtons.forEach((b) => (b.disabled = true));

    // Logique d'attaque de l'adversaire
    if (turnCount % 2 === 0 && roarCountOnPlayer < 4) {
        const supportData = attacks[opponent].Rugissement;
        const hitChance = Math.floor(Math.random() * 100) + 1;

        if (hitChance <= supportData.accuracy) {
            addLog(`${opponent} utilise Rugissement !`);
            roarCountOnPlayer++;
        } else {
            addLog(`${opponent} rate son attaque Rugissement !`);
        }

        updateHP();
        animateAttack(document.getElementById("pokemon2-img"), "Rugissement");
    } else {
        let attackToUse = null;

        // Détermine quelle attaque utiliser en fonction de l'échec précédent
        if (lastFailedAttack === "Feu d'Enfer") {
            attackToUse = "Ultimapoing";
        } else if (lastFailedAttack === "Ultimapoing") {
            attackToUse = "Crocs Feu";
        } else {
            attackToUse = "Feu d'Enfer";
        }

        // Tente l'attaque
        const attackSuccess = tryAttack(opponent, player, attackToUse);

        // Si l'attaque échoue, on enregistre l'attaque pour le prochain tour
        if (!attackSuccess) {
            lastFailedAttack = attackToUse;
        } else {
            lastFailedAttack = null; // Réinitialise si l'attaque réussit
        }

        // Vérifie si Pikachu est vaincu
        if (hp1 <= 0) {
            hp1 = 0; // Empêche les PV d'être négatifs
            updateHP();
            addLog(`${opponent} a vaincu ${player} !`);
            document.getElementById("restart-btn").style.display = "inline-block"; // <-- Ajout
            return;
        }

        // Anime l'attaque et met à jour les PV
        animateAttack(document.getElementById("pokemon2-img"), attackToUse);
        updateHP();
    }

    // Passe le tour au joueur après un délai
    setTimeout(() => {
        isPlayerTurn = true;
        attackButtons.forEach((b) => (b.disabled = false)); // Réactive les boutons pour le joueur
    }, 1000);
}

// Petite fonction pour encapsuler l'attaque
function tryAttack(attacker, defender, attackName) {
    const dmg = applyAttack(attacker, defender, attackName);
    if (dmg > 0) {
        // Attaque offensive réussie
        if (defender === player) {
            hp1 -= dmg;
            if (hp1 < 0) hp1 = 0;
            addLog(`${attacker} utilise ${attackName} !`, player, hp1);
        } else {
            hp2 -= dmg;
            if (hp2 < 0) hp2 = 0;
            addLog(`${attacker} utilise ${attackName} !`, opponent, hp2);
        }
        updateHP();
        return true;
    } else if (dmg === -1) {
        // Soutien réussi (Reflet)
        return true;
    } else if (attacks[attacker][attackName].isSupport) {
        // Pour éviter le message "rate son attaque" pour les attaques de soutien
        return false;
    } else {
        addLog(`${attacker} rate son attaque ${attackName} !`);
        return false;
    }
}

attackButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isPlayerTurn || hp2 <= 0) return; // Bloque si ce n'est pas le tour du joueur ou si Salamèche est vaincu
  
      const attackName = btn.dataset.attack;
      const dmg = applyAttack(player, opponent, attackName);
  
      // Si l'attaque est invalide (null), on ne fait rien
      if (dmg === null) {
        return;
      }
  
      attackButtons.forEach((b) => (b.disabled = true)); // Désactive les boutons d'attaque immédiatement
  
      if (dmg > 0) {
        hp2 -= dmg;
        addLog(`${player} utilise ${attackName} !`, opponent, hp2);
      } else if (dmg === -1) {
        // Attaque de soutien réussie
      } else {
        addLog(`${player} rate son attaque ${attackName} !`);
      }
  
      if (hp2 <= 0) {
        hp2 = 0; // Empêche les PV d'être négatifs
        updateHP();
        addLog(`${player} a vaincu ${opponent} !`);
        playVictoryMusic();
        addLog("RÉPONSE : Pierre eau");
        return; // Fin de combat
      }
  
      // Mise à jour des PV, animation, et bascule du tour
      updateHP();
      animateAttack(document.getElementById("pokemon1-img"), attackName);
      isPlayerTurn = false; // Passe le tour à l'adversaire
  
      // L'adversaire attaque après un délai
      setTimeout(() => {
        opponentAttack();
        if (hp1 > 0) {
          // Réactive les boutons si le joueur n'est pas vaincu
          attackButtons.forEach((b) => (b.disabled = false));
        }
      }, 1000);
    });
});   

// Initialiser les PV
updateHP();