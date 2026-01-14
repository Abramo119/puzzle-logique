// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Configuration globale du jeu
    const CONFIG = {
        cellSize: 40,
        colors: {
            grid: '#1e3a5f',
            cellBorder: '#3498db',
            piece1: '#2ecc71',
            piece2: '#e74c3c',
            piece3: '#3498db',
            piece4: '#f1c40f',
            piece5: '#9b59b6',
            piece6: '#1abc9c',
            piece7: '#e67e22'
        },
        initialTime: 120, // 2 minutes en secondes
        timeReduction: 10, // Réduction de temps par niveau
        baseScore: 100,
        maxLevel: 10
    };

    // Définition des pièces (formes Tetris-like et variations)
    const PIECE_DEFINITIONS = [
        // Forme I (4 cellules en ligne)
        {
            id: 'I',
            shape: [[1, 1, 1, 1]],
            color: CONFIG.colors.piece1
        },
        // Forme O (carré 2x2)
        {
            id: 'O',
            shape: [[1, 1], [1, 1]],
            color: CONFIG.colors.piece2
        },
        // Forme T
        {
            id: 'T',
            shape: [[0, 1, 0], [1, 1, 1]],
            color: CONFIG.colors.piece3
        },
        // Forme L
        {
            id: 'L',
            shape: [[1, 0], [1, 0], [1, 1]],
            color: CONFIG.colors.piece4
        },
        // Forme J (miroir de L)
        {
            id: 'J',
            shape: [[0, 1], [0, 1], [1, 1]],
            color: CONFIG.colors.piece5
        },
        // Forme S
        {
            id: 'S',
            shape: [[0, 1, 1], [1, 1, 0]],
            color: CONFIG.colors.piece6
        },
        // Forme Z
        {
            id: 'Z',
            shape: [[1, 1, 0], [0, 1, 1]],
            color: CONFIG.colors.piece7
        },
        // Forme plus (+)
        {
            id: 'PLUS',
            shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
            color: CONFIG.colors.piece1,
            level: 3
        },
        // Forme U
        {
            id: 'U',
            shape: [[1, 0, 1], [1, 1, 1]],
            color: CONFIG.colors.piece2,
            level: 4
        }
    ];

    // Définition des niveaux
    const LEVELS = [
        { grid: [4, 4], pieces: ['I', 'O', 'L', 'J'], time: CONFIG.initialTime },
        { grid: [5, 5], pieces: ['I', 'O', 'L', 'J', 'T'], time: CONFIG.initialTime - 10 },
        { grid: [5, 6], pieces: ['I', 'O', 'L', 'J', 'T', 'S'], time: CONFIG.initialTime - 20 },
        { grid: [6, 6], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z'], time: CONFIG.initialTime - 30 },
        { grid: [7, 7], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z', 'PLUS'], time: CONFIG.initialTime - 40 },
        { grid: [8, 8], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z', 'PLUS', 'U'], time: CONFIG.initialTime - 50 },
        { grid: [9, 9], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z', 'PLUS', 'U'], time: CONFIG.initialTime - 60, mirror: true },
        { grid: [10, 10], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z', 'PLUS', 'U'], time: CONFIG.initialTime - 70, rotationLocked: true },
        { grid: [8, 12], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z', 'PLUS', 'U'], time: CONFIG.initialTime - 80, obstacles: true },
        { grid: [12, 12], pieces: ['I', 'O', 'L', 'J', 'T', 'S', 'Z', 'PLUS', 'U'], time: CONFIG.initialTime - 90, timeAttack: true }
    ];

    // Variables d'état du jeu
    let gameState = {
        currentLevel: 0,
        score: 0,
        timeLeft: 0,
        timer: null,
        grid: [],
        pieces: [],
        draggedPiece: null,
        dragOffset: { x: 0, y: 0 },
        placedPieces: [],
        isGameActive: false,
        startTime: 0,
        usedPieces: new Set(),
        gridObstacles: []
    };

    // Références aux éléments DOM
    const elements = {
        gameGrid: document.getElementById('game-grid'),
        gridOverlay: document.getElementById('grid-overlay'),
        piecesContainer: document.getElementById('pieces-container'),
        levelDisplay: document.getElementById('level-display'),
        timerDisplay: document.getElementById('timer-display'),
        scoreDisplay: document.getElementById('score-display'),
        resetBtn: document.getElementById('reset-btn'),
        hintBtn: document.getElementById('hint-btn'),
        rotateBtn: document.getElementById('rotate-btn'),
        flipBtn: document.getElementById('flip-btn'),
        gridSize: document.getElementById('grid-size'),
        messageBox: document.getElementById('message-box'),
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        levelButtons: document.getElementById('level-buttons'),
        modal: document.getElementById('modal'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalTime: document.getElementById('modal-time'),
        modalScore: document.getElementById('modal-score'),
        nextLevelBtn: document.getElementById('next-level-btn'),
        retryBtn: document.getElementById('retry-btn'),
        closeModalBtn: document.getElementById('close-modal-btn')
    };

    // Contexte du canvas
    const ctx = elements.gameGrid.getContext('2d');

    // Initialisation du jeu
    function initGame() {
        generateLevelButtons();
        loadLevel(0);
        setupEventListeners();
        updateDisplay();
    }

    // Génération des boutons de niveau
    function generateLevelButtons() {
        elements.levelButtons.innerHTML = '';
        for (let i = 0; i < LEVELS.length; i++) {
            const button = document.createElement('button');
            button.className = 'level-btn';
            if (i === 0) button.classList.add('active');
            button.textContent = i + 1;
            button.dataset.level = i;
            button.addEventListener('click', () => loadLevel(i));
            elements.levelButtons.appendChild(button);
        }
    }

    // Chargement d'un niveau
    function loadLevel(levelIndex) {
        // Réinitialiser l'état
        clearInterval(gameState.timer);
        gameState.currentLevel = levelIndex;
        gameState.placedPieces = [];
        gameState.usedPieces.clear();
        gameState.draggedPiece = null;
        gameState.gridObstacles = [];
        
        const level = LEVELS[levelIndex];
        
        // Mettre à jour l'affichage du niveau
        document.querySelectorAll('.level-btn').forEach((btn, index) => {
            btn.classList.remove('active');
            if (index === levelIndex) btn.classList.add('active');
            if (index < levelIndex) btn.classList.add('completed');
        });
        
        // Initialiser la grille
        initializeGrid(level.grid[0], level.grid[1]);
        
        // Ajouter des obstacles si configuré
        if (level.obstacles) {
            addObstacles(level.grid[0] * level.grid[1] * 0.1); // 10% de cellules bloquées
        }
        
        // Initialiser les pièces
        initializePieces(level.pieces);
        
        // Configurer le temps
        gameState.timeLeft = level.time;
        gameState.startTime = Date.now();
        gameState.isGameActive = true;
        
        // Démarrer le timer
        startTimer();
        
        // Redessiner
        drawGrid();
        drawPiecesInContainer();
        
        // Mettre à jour l'affichage
        updateDisplay();
        updateMessage(`Niveau ${levelIndex + 1}: Placez les pièces pour remplir le plateau ${level.grid[0]}×${level.grid[1]}`);
        
        // Redimensionner le canvas si nécessaire
        resizeCanvas(level.grid[0], level.grid[1]);
    }

    // Initialisation de la grille
    function initializeGrid(rows, cols) {
        gameState.grid = [];
        for (let i = 0; i < rows; i++) {
            gameState.grid[i] = [];
            for (let j = 0; j < cols; j++) {
                gameState.grid[i][j] = {
                    occupied: false,
                    pieceId: null,
                    obstacle: false
                };
            }
        }
        
        // Mettre à jour l'affichage de la taille
        elements.gridSize.textContent = `${rows}×${cols}`;
    }

    // Ajout d'obstacles
    function addObstacles(count) {
        const rows = gameState.grid.length;
        const cols = gameState.grid[0].length;
        
        for (let i = 0; i < count; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * rows);
                col = Math.floor(Math.random() * cols);
            } while (gameState.grid[row][col].obstacle);
            
            gameState.grid[row][col].obstacle = true;
            gameState.gridObstacles.push({ row, col });
        }
    }

    // Initialisation des pièces
    function initializePieces(pieceIds) {
        gameState.pieces = [];
        const container = elements.piecesContainer;
        container.innerHTML = '';
        
        pieceIds.forEach(pieceId => {
            const definition = PIECE_DEFINITIONS.find(p => p.id === pieceId);
            if (definition) {
                const piece = {
                    id: pieceId,
                    shape: definition.shape,
                    color: definition.color,
                    rotation: 0,
                    flipped: false,
                    position: { row: -1, col: -1 },
                    isPlaced: false
                };
                
                gameState.pieces.push(piece);
                
                // Créer l'élément DOM pour la pièce
                const pieceElement = document.createElement('div');
                pieceElement.className = 'piece';
                pieceElement.dataset.pieceId = pieceId;
                pieceElement.innerHTML = `<span>${pieceId}</span>`;
                
                // Style dynamique pour la couleur
                pieceElement.style.borderColor = definition.color;
                pieceElement.style.color = definition.color;
                
                // Ajouter les cellules visuelles à la pièce
                const pieceSize = 80; // Taille de l'élément DOM
                const cellSize = pieceSize / Math.max(definition.shape.length, definition.shape[0].length);
                
                definition.shape.forEach((row, i) => {
                    row.forEach((cell, j) => {
                        if (cell === 1) {
                            const cellElement = document.createElement('div');
                            cellElement.className = 'piece-cell';
                            cellElement.style.width = `${cellSize}px`;
                            cellElement.style.height = `${cellSize}px`;
                            cellElement.style.left = `${j * cellSize}px`;
                            cellElement.style.top = `${i * cellSize}px`;
                            cellElement.style.background = definition.color;
                            pieceElement.appendChild(cellElement);
                        }
                    });
                });
                
                // Événements de glisser-déposer
                pieceElement.addEventListener('mousedown', (e) => startDrag(e, piece));
                pieceElement.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    startDrag(e.touches[0], piece);
                });
                
                container.appendChild(pieceElement);
            }
        });
    }

    // Redimensionnement du canvas
    function resizeCanvas(rows, cols) {
        const size = Math.max(rows, cols) * CONFIG.cellSize;
        elements.gameGrid.width = size;
        elements.gameGrid.height = size;
        elements.gridOverlay.style.width = `${size}px`;
        elements.gridOverlay.style.height = `${size}px`;
    }

    // Démarrage du timer
    function startTimer() {
        clearInterval(gameState.timer);
        gameState.timer = setInterval(() => {
            if (gameState.isGameActive) {
                gameState.timeLeft--;
                
                if (gameState.timeLeft <= 0) {
                    gameState.timeLeft = 0;
                    gameOver(false);
                }
                
                updateDisplay();
            }
        }, 1000);
    }

    // Dessin de la grille
    function drawGrid() {
        const rows = gameState.grid.length;
        const cols = gameState.grid[0].length;
        const cellSize = CONFIG.cellSize;
        
        // Effacer le canvas
        ctx.clearRect(0, 0, elements.gameGrid.width, elements.gameGrid.height);
        
        // Dessiner les cellules
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = j * cellSize;
                const y = i * cellSize;
                
                // Couleur de fond
                ctx.fillStyle = gameState.grid[i][j].obstacle ? '#7f8c8d' : CONFIG.colors.grid;
                ctx.fillRect(x, y, cellSize, cellSize);
                
                // Bordure
                ctx.strokeStyle = CONFIG.colors.cellBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, cellSize, cellSize);
                
                // Si occupé, dessiner la couleur de la pièce
                if (gameState.grid[i][j].occupied) {
                    const piece = gameState.placedPieces.find(p => p.id === gameState.grid[i][j].pieceId);
                    if (piece) {
                        ctx.fillStyle = piece.color;
                        ctx.globalAlpha = 0.7;
                        ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                        ctx.globalAlpha = 1.0;
                    }
                }
                
                // Marquer les obstacles
                if (gameState.grid[i][j].obstacle) {
                    ctx.fillStyle = '#34495e';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('✕', x + cellSize/2, y + cellSize/2);
                }
            }
        }
    }

    // Dessin des pièces dans le conteneur
    function drawPiecesInContainer() {
        // Cette fonction est gérée par la création des éléments DOM dans initializePieces
    }

    // Mise à jour de l'affichage
    function updateDisplay() {
        elements.levelDisplay.textContent = gameState.currentLevel + 1;
        elements.scoreDisplay.textContent = gameState.score;
        
        // Formatage du temps
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        elements.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Mise à jour de la progression
        updateProgress();
    }

    // Mise à jour de la progression
    function updateProgress() {
        const totalCells = gameState.grid.length * gameState.grid[0].length;
        let occupiedCells = 0;
        let obstacleCells = gameState.gridObstacles.length;
        
        // Compter les cellules occupées
        for (let i = 0; i < gameState.grid.length; i++) {
            for (let j = 0; j < gameState.grid[i].length; j++) {
                if (gameState.grid[i][j].occupied) {
                    occupiedCells++;
                }
            }
        }
        
        // Calculer le pourcentage (en excluant les obstacles)
        const availableCells = totalCells - obstacleCells;
        const percentage = availableCells > 0 ? Math.round((occupiedCells / availableCells) * 100) : 0;
        
        elements.progressFill.style.width = `${percentage}%`;
        elements.progressText.textContent = `${percentage}%`;
        
        // Changer la couleur en fonction du pourcentage
        if (percentage < 30) {
            elements.progressFill.style.background = '#e74c3c';
        } else if (percentage < 70) {
            elements.progressFill.style.background = '#f1c40f';
        } else {
            elements.progressFill.style.background = '#2ecc71';
        }
    }

    // Mise à jour du message
    function updateMessage(message) {
        elements.messageBox.innerHTML = `<p>${message}</p>`;
    }

    // Début du glisser-déposer
    function startDrag(e, piece) {
        if (piece.isPlaced || !gameState.isGameActive) return;
        
        gameState.draggedPiece = {
            ...piece,
            element: e.target.closest('.piece'),
            originalPosition: { ...piece.position }
        };
        
        // Calculer l'offset de la souris par rapport à l'élément
        const rect = gameState.draggedPiece.element.getBoundingClientRect();
        gameState.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Ajouter la classe de style
        gameState.draggedPiece.element.classList.add('dragging');
        
        // Ajouter les événements de mouvement et de relâchement
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', onDrop);
        document.addEventListener('touchmove', onTouchDrag);
        document.addEventListener('touchend', onTouchDrop);
    }

    // Glissement (souris)
    function onDrag(e) {
        if (!gameState.draggedPiece) return;
        
        const x = e.clientX - gameState.dragOffset.x;
        const y = e.clientY - gameState.dragOffset.y;
        
        gameState.draggedPiece.element.style.position = 'fixed';
        gameState.draggedPiece.element.style.left = `${x}px`;
        gameState.draggedPiece.element.style.top = `${y}px`;
        gameState.draggedPiece.element.style.zIndex = '1000';
    }

    // Glissement (touch)
    function onTouchDrag(e) {
        if (!gameState.draggedPiece || !e.touches[0]) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const x = touch.clientX - gameState.dragOffset.x;
        const y = touch.clientY - gameState.dragOffset.y;
        
        gameState.draggedPiece.element.style.position = 'fixed';
        gameState.draggedPiece.element.style.left = `${x}px`;
        gameState.draggedPiece.element.style.top = `${y}px`;
        gameState.draggedPiece.element.style.zIndex = '1000';
    }

    // Déposer la pièce
    function onDrop(e) {
        if (!gameState.draggedPiece) return;
        
        // Calculer la position sur la grille
        const gridRect = elements.gameGrid.getBoundingClientRect();
        const cellSize = CONFIG.cellSize;
        
        const gridX = e.clientX - gridRect.left;
        const gridY = e.clientY - gridRect.top;
        
        const col = Math.floor(gridX / cellSize);
        const row = Math.floor(gridY / cellSize);
        
        // Vérifier si le placement est valide
        if (isValidPlacement(gameState.draggedPiece, row, col)) {
            placePiece(gameState.draggedPiece, row, col);
        } else {
            // Revenir à la position d'origine
            resetPiecePosition(gameState.draggedPiece);
        }
        
        cleanupDrag();
    }

    // Déposer (touch)
    function onTouchDrop(e) {
        if (!gameState.draggedPiece) return;
        
        const touch = e.changedTouches[0];
        const gridRect = elements.gameGrid.getBoundingClientRect();
        const cellSize = CONFIG.cellSize;
        
        const gridX = touch.clientX - gridRect.left;
        const gridY = touch.clientY - gridRect.top;
        
        const col = Math.floor(gridX / cellSize);
        const row = Math.floor(gridY / cellSize);
        
        if (isValidPlacement(gameState.draggedPiece, row, col)) {
            placePiece(gameState.draggedPiece, row, col);
        } else {
            resetPiecePosition(gameState.draggedPiece);
        }
        
        cleanupDrag();
    }

    // Nettoyage après glisser-déposer
    function cleanupDrag() {
        if (!gameState.draggedPiece) return;
        
        // Retirer les événements
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', onDrop);
        document.removeEventListener('touchmove', onTouchDrag);
        document.removeEventListener('touchend', onTouchDrop);
        
        // Retirer la classe de style
        gameState.draggedPiece.element.classList.remove('dragging');
        gameState.draggedPiece.element.style.position = '';
        gameState.draggedPiece.element.style.left = '';
        gameState.draggedPiece.element.style.top = '';
        gameState.draggedPiece.element.style.zIndex = '';
        
        gameState.draggedPiece = null;
    }

    // Vérification de la validité du placement
    function isValidPlacement(piece, row, col) {
        const shape = getCurrentShape(piece);
        const rows = gameState.grid.length;
        const cols = gameState.grid[0].length;
        
        // Vérifier chaque cellule de la pièce
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    const targetRow = row + i;
                    const targetCol = col + j;
                    
                    // Vérifier les limites
                    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) {
                        return false;
                    }
                    
                    // Vérifier si la cellule est déjà occupée ou est un obstacle
                    if (gameState.grid[targetRow][targetCol].occupied || 
                        gameState.grid[targetRow][targetCol].obstacle) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    // Placement d'une pièce
    function placePiece(piece, row, col) {
        const shape = getCurrentShape(piece);
        
        // Marquer les cellules comme occupées
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    const targetRow = row + i;
                    const targetCol = col + j;
                    
                    gameState.grid[targetRow][targetCol].occupied = true;
                    gameState.grid[targetRow][targetCol].pieceId = piece.id;
                }
            }
        }
        
        // Mettre à jour l'état de la pièce
        const originalPiece = gameState.pieces.find(p => p.id === piece.id);
        originalPiece.isPlaced = true;
        originalPiece.position = { row, col };
        
        // Ajouter à la liste des pièces placées
        gameState.placedPieces.push({
            ...originalPiece,
            placementRow: row,
            placementCol: col
        });
        
        // Marquer comme utilisée dans le DOM
        const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (pieceElement) {
            pieceElement.classList.add('used');
            pieceElement.style.opacity = '0.5';
        }
        
        // Redessiner la grille
        drawGrid();
        
        // Vérifier la victoire
        checkVictory();
        
        // Mettre à jour la progression
        updateProgress();
        
        updateMessage(`Pièce ${piece.id} placée avec succès!`);
    }

    // Réinitialisation de la position d'une pièce
    function resetPiecePosition(piece) {
        const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (pieceElement) {
            pieceElement.style.position = '';
            pieceElement.style.left = '';
            pieceElement.style.top = '';
            pieceElement.style.zIndex = '';
        }
        updateMessage(`Placement invalide pour la pièce ${piece.id}`);
    }

    // Obtenir la forme actuelle (avec rotation et retournement)
    function getCurrentShape(piece) {
        let shape = piece.shape;
        
        // Appliquer la rotation
        for (let i = 0; i < piece.rotation; i++) {
            shape = rotateMatrix(shape);
        }
        
        // Appliquer le retournement horizontal si nécessaire
        if (piece.flipped) {
            shape = flipMatrix(shape);
        }
        
        return shape;
    }

    // Rotation d'une matrice 90°
    function rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = [];
        
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = matrix[rows - 1 - j][i];
            }
        }
        
        return rotated;
    }

    // Retournement horizontal d'une matrice
    function flipMatrix(matrix) {
        return matrix.map(row => [...row].reverse());
    }

    // Vérification de la victoire
    function checkVictory() {
        const rows = gameState.grid.length;
        const cols = gameState.grid[0].length;
        let allOccupied = true;
        
        // Vérifier si toutes les cellules non-obstacles sont occupées
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                if (!gameState.grid[i][j].occupied && !gameState.grid[i][j].obstacle) {
                    allOccupied = false;
                    break;
                }
            }
            if (!allOccupied) break;
        }
        
        if (allOccupied) {
            gameOver(true);
        }
    }

    // Fin de partie
    function gameOver(isVictory) {
        gameState.isGameActive = false;
        clearInterval(gameState.timer);
        
        if (isVictory) {
            // Calculer le score
            const timeBonus = Math.floor(gameState.timeLeft * 5);
            const levelBonus = (gameState.currentLevel + 1) * 50;
            const totalScore = CONFIG.baseScore + timeBonus + levelBonus;
            
            gameState.score += totalScore;
            
            // Afficher la modal de victoire
            showModal(
                'Félicitations!',
                `Vous avez complété le niveau ${gameState.currentLevel + 1}!`,
                gameState.timeLeft,
                totalScore
            );
            
            // Marquer le niveau comme complété
            const levelBtn = document.querySelector(`.level-btn[data-level="${gameState.currentLevel}"]`);
            if (levelBtn) {
                levelBtn.classList.add('completed');
            }
            
            // Jouer un son de victoire (simulé)
            playSound('victory');
        } else {
            // Afficher la modal de défaite
            showModal(
                'Temps écoulé!',
                'Le temps est écoulé. Essayez à nouveau!',
                0,
                0
            );
            
            // Jouer un son de défaite (simulé)
            playSound('gameover');
        }
    }

    // Affichage de la modal
    function showModal(title, message, timeLeft, score) {
        elements.modalTitle.textContent = title;
        elements.modalMessage.textContent = message;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        elements.modalTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        elements.modalScore.textContent = `+${score}`;
        elements.modal.style.display = 'flex';
    }

    // Simulation de son
    function playSound(type) {
        // En production, vous pourriez utiliser l'API Web Audio
        console.log(`Son joué: ${type}`);
        
        // Pour un vrai projet, ajoutez des fichiers audio et utilisez:
        // const audio = new Audio(`sounds/${type}.mp3`);
        // audio.play();
    }

    // Rotation d'une pièce
    function rotatePiece() {
        if (!gameState.draggedPiece || !gameState.isGameActive) return;
        
        gameState.draggedPiece.rotation = (gameState.draggedPiece.rotation + 1) % 4;
        
        // Mettre à jour la pièce dans l'état global
        const originalPiece = gameState.pieces.find(p => p.id === gameState.draggedPiece.id);
        if (originalPiece && !originalPiece.isPlaced) {
            originalPiece.rotation = gameState.draggedPiece.rotation;
            
            // Mettre à jour l'affichage dans le conteneur
            updatePieceDisplay(originalPiece);
        }
        
        updateMessage(`Pièce ${gameState.draggedPiece.id} tournée de 90°`);
    }

    // Retournement d'une pièce
    function flipPiece() {
        if (!gameState.draggedPiece || !gameState.isGameActive) return;
        
        gameState.draggedPiece.flipped = !gameState.draggedPiece.flipped;
        
        // Mettre à jour la pièce dans l'état global
        const originalPiece = gameState.pieces.find(p => p.id === gameState.draggedPiece.id);
        if (originalPiece && !originalPiece.isPlaced) {
            originalPiece.flipped = gameState.draggedPiece.flipped;
            
            // Mettre à jour l'affichage dans le conteneur
            updatePieceDisplay(originalPiece);
        }
        
        updateMessage(`Pièce ${gameState.draggedPiece.id} retournée horizontalement`);
    }

    // Mise à jour de l'affichage d'une pièce dans le conteneur
    function updatePieceDisplay(piece) {
        const pieceElement = document.querySelector(`[data-piece-id="${piece.id}"]`);
        if (!pieceElement || piece.isPlaced) return;
        
        // Vider et recréer les cellules
        const existingCells = pieceElement.querySelectorAll('.piece-cell');
        existingCells.forEach(cell => cell.remove());
        
        // Créer les nouvelles cellules
        const shape = getCurrentShape(piece);
        const pieceSize = 80;
        const cellSize = pieceSize / Math.max(shape.length, shape[0].length);
        
        shape.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 1) {
                    const cellElement = document.createElement('div');
                    cellElement.className = 'piece-cell';
                    cellElement.style.width = `${cellSize}px`;
                    cellElement.style.height = `${cellSize}px`;
                    cellElement.style.left = `${j * cellSize}px`;
                    cellElement.style.top = `${i * cellSize}px`;
                    cellElement.style.background = piece.color;
                    pieceElement.appendChild(cellElement);
                }
            });
        });
    }

    // Indice (place une pièce aléatoirement)
    function giveHint() {
        if (!gameState.isGameActive) return;
        
        // Trouver une pièce non placée
        const availablePieces = gameState.pieces.filter(p => !p.isPlaced);
        if (availablePieces.length === 0) return;
        
        const randomPiece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
        const rows = gameState.grid.length;
        const cols = gameState.grid[0].length;
        const shape = getCurrentShape(randomPiece);
        
        // Essayer de trouver une position valide
        for (let attempt = 0; attempt < 100; attempt++) {
            const row = Math.floor(Math.random() * (rows - shape.length + 1));
            const col = Math.floor(Math.random() * (cols - shape[0].length + 1));
            
            if (isValidPlacement(randomPiece, row, col)) {
                // Créer un objet pièce temporaire pour le placement
                const tempPiece = {
                    ...randomPiece,
                    element: document.querySelector(`[data-piece-id="${randomPiece.id}"]`)
                };
                
                placePiece(tempPiece, row, col);
                updateMessage(`Indice: Pièce ${randomPiece.id} placée automatiquement!`);
                
                // Pénalité de score pour l'indice
                gameState.score = Math.max(0, gameState.score - 20);
                updateDisplay();
                
                return;
            }
        }
        
        updateMessage("Aucun placement trouvé pour l'indice. Essayez de tourner la pièce!");
    }

    // Configuration des événements
    function setupEventListeners() {
        // Bouton de réinitialisation
        elements.resetBtn.addEventListener('click', () => loadLevel(gameState.currentLevel));
        
        // Bouton d'indice
        elements.hintBtn.addEventListener('click', giveHint);
        
        // Boutons de rotation et retournement
        elements.rotateBtn.addEventListener('click', rotatePiece);
        elements.flipBtn.addEventListener('click', flipPiece);
        
        // Boutons de la modal
        elements.nextLevelBtn.addEventListener('click', () => {
            if (gameState.currentLevel < LEVELS.length - 1) {
                elements.modal.style.display = 'none';
                loadLevel(gameState.currentLevel + 1);
            } else {
                elements.modal.style.display = 'none';
                updateMessage("Félicitations! Vous avez terminé tous les niveaux!");
            }
        });
        
        elements.retryBtn.addEventListener('click', () => {
            elements.modal.style.display = 'none';
            loadLevel(gameState.currentLevel);
        });
        
        elements.closeModalBtn.addEventListener('click', () => {
            elements.modal.style.display = 'none';
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (!gameState.isGameActive) return;
            
            switch(e.key.toLowerCase()) {
                case 'r':
                    rotatePiece();
                    e.preventDefault();
                    break;
                case 'f':
                    flipPiece();
                    e.preventDefault();
                    break;
                case 'h':
                    giveHint();
                    e.preventDefault();
                    break;
                case 'escape':
                    if (elements.modal.style.display === 'flex') {
                        elements.modal.style.display = 'none';
                    }
                    break;
            }
        });
        
        // Empêcher le comportement par défaut du glisser-déposer
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    // Initialisation
    initGame();

    // Exporter certaines fonctions pour le débogage
    window.game = {
        state: gameState,
        config: CONFIG,
        levels: LEVELS,
        pieces: PIECE_DEFINITIONS,
        rotatePiece,
        flipPiece,
        giveHint,
        loadLevel: (level) => loadLevel(level)
    };
});