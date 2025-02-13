document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('gameArea');
    const panda = document.getElementById('panda');
    const food = document.getElementById('food');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const gameOverElement = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".main-nav");

    // Sons
    const leafSound = new Audio('sounds/folha.mp3');
    const gameOverSound = new Audio('sounds/game-over.mp3');
    const fireSound = new Audio('sounds/fogo-pontos.mp3');
    const lightningSound = new Audio('sounds/raio.mp3');
    const bgMusic = new Audio('sounds/gamemusic.mp3');

    // Configurações do jogo
    const config = {
        gridSize: 27,
        gridHeight: 16,
        baseSpeed: 200,
        levels: {
            1: { speed: 200, obstacles: 3, theme: 'jungle' },
            2: { speed: 170, obstacles: 5, theme: 'desert' },
            3: { speed: 140, obstacles: 7, theme: 'night' },
            4: { speed: 110, obstacles: 9, theme: 'beach' },
            5: { speed: 80, obstacles: 12, theme: 'jungle' }
        }
    };

    // Estado do jogo
    let state = {
        pandaX: 10,
        pandaY: 10,
        foodX: 5,
        foodY: 5,
        velocityX: 1,
        velocityY: 0,
        score: 0,
        level: 1,
        obstacles: [],
        gameLoop: null,
        bgMusicPlaying: false
    };

    // Menu Hamburguer
    menuToggle.addEventListener("click", () => {
        navMenu.classList.toggle("show");
        menuToggle.classList.toggle("active");
    });

    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove("show");
            menuToggle.classList.remove("active");
        });
    });

    function initGame() {
        setupEventListeners();
        spawnFood();
        generateObstacles(config.levels[state.level].obstacles);
        updateGameAreaTheme();
        startGameLoop();
        startBackgroundMusic();
    }

    function setupEventListeners() {
        document.addEventListener('keydown', handleKeys);
        document.getElementById('pause').addEventListener('click', togglePause);
        document.getElementById('reset').addEventListener('click', resetGame);
    }

    function handleKeys(e) {
        e.preventDefault();
        const directions = {
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0]
        };
        
        if (directions[e.key]) {
            const [newX, newY] = directions[e.key];
            if (state.velocityX !== newX || state.velocityY !== newY) {
                state.velocityX = newX;
                state.velocityY = newY;
            }
        }
    }

    function startGameLoop() {
        if (state.gameLoop) clearInterval(state.gameLoop);
        state.gameLoop = setInterval(gameLoop, config.levels[state.level].speed);
    }

    function gameLoop() {
        if (state.isPaused) return;
        
        movePanda();
        checkCollisions();
        updatePositions();
        checkLevelUp();
    }

    function movePanda() {
        state.pandaX = clamp(state.pandaX + state.velocityX, 0, config.gridSize - 1);
        state.pandaY = clamp(state.pandaY + state.velocityY, 0, config.gridHeight - 1);
    }

    function checkCollisions() {
        // Colisão com obstáculos
        state.obstacles.forEach(obs => {
            if (obs.x === state.pandaX && obs.y === state.pandaY) {
                handleObstacleCollision(obs.type);
            }
        });

        // Colisão com comida
        if (state.pandaX === state.foodX && state.pandaY === state.foodY) {
            handleFoodCollision();
        }
    }

    function startBackgroundMusic() {
        bgMusic.loop = true;
        bgMusic.play().catch(error => {
            console.log('A reprodução da música foi prevenida pelo navegador:', error);
        });
        state.bgMusicPlaying = true;
    }

    function handleObstacleCollision(type) {
        switch(type) {
            case 'skull':
                gameOver();
                break;
            case 'fire':
                state.score = Math.floor(state.score * 0.5);
                scoreElement.textContent = `🍃 ${state.score}`;
                fireSound.currentTime = 0;
                fireSound.play();
                break;
            case 'lightning':
                clearInterval(state.gameLoop);
                state.gameLoop = setInterval(gameLoop, config.baseSpeed * 0.7);
                lightningSound.currentTime = 0;
                lightningSound.play();
                break;
        }
    }

    function handleFoodCollision() {
        state.score++;
        scoreElement.textContent = `🍃 ${state.score}`;
        leafSound.play();
        spawnFood();
    }

    function spawnFood() {
        do {
            state.foodX = randomPosition(config.gridSize);
            state.foodY = randomPosition(config.gridHeight);
        } while (invalidPosition(state.foodX, state.foodY));
    }

    function invalidPosition(x, y) {
        return state.obstacles.some(obs => obs.x === x && obs.y === y) ||
               (x === state.pandaX && y === state.pandaY);
    }

    function generateObstacles(count) {
        // Limpar obstáculos antigos
        state.obstacles.forEach(obs => obs.element.remove());
        state.obstacles = [];
        
        const types = ['fire', 'skull', 'lightning'];
        
        for (let i = 0; i < count; i++) {
            let newObstacle;
            do {
                newObstacle = {
                    x: randomPosition(config.gridSize),
                    y: randomPosition(config.gridHeight),
                    type: types[i % types.length],
                    element: createObstacleElement(types[i % types.length])
                };
            } while (invalidPosition(newObstacle.x, newObstacle.y));
            
            state.obstacles.push(newObstacle);
        }
    }

    function createObstacleElement(type) {
        const obstacle = document.createElement('div');
        obstacle.className = `obstacle ${type}`;
        obstacle.innerHTML = `<i class="fa-solid fa-${type === 'lightning' ? 'bolt' : type}"></i>`;
        gameArea.appendChild(obstacle);
        return obstacle;
    }

    function updatePositions() {
        const cellSize = calculateCellSize();
        
        // Atualizar posição do Panda
        panda.style.transform = `translate(
            ${state.pandaX * cellSize.width}px, 
            ${state.pandaY * cellSize.height}px
        )`;

        // Atualizar posição da Comida
        food.style.transform = `translate(
            ${state.foodX * cellSize.width}px, 
            ${state.foodY * cellSize.height}px
        )`;

        // Atualizar obstáculos
        state.obstacles.forEach(obs => {
            obs.element.style.transform = `translate(
                ${obs.x * cellSize.width}px, 
                ${obs.y * cellSize.height}px
            )`;
        });
    }

    function checkLevelUp() {
        const nextLevel = Math.floor(state.score / 10) + 1;
        if (nextLevel > state.level && nextLevel <= Object.keys(config.levels).length) {
            state.level = nextLevel;
            updateLevel();
        }
    }

    function updateLevel() {
        levelElement.textContent = `Nível ${state.level}`;
        generateObstacles(config.levels[state.level].obstacles);
        updateGameAreaTheme();
        startGameLoop();
    }

    function updateGameAreaTheme() {
        gameArea.className = `game-area ${config.levels[state.level].theme}`;
    }

    function togglePause() {
        state.isPaused = !state.isPaused;
        document.getElementById('pause').textContent = state.isPaused ? '▶' : '⏸';
        if (state.isPaused) {
            bgMusic.pause();
        } else {
            bgMusic.play();
        }
    }

    function gameOver() {
        clearInterval(state.gameLoop);
        finalScoreElement.textContent = state.score;
        gameOverElement.style.display = 'block';
        bgMusic.pause();
        bgMusic.currentTime = 0;
        gameOverSound.play();
    }

    function resetGame() {
        clearInterval(state.gameLoop);
        state = {
            pandaX: 10,
            pandaY: 10,
            foodX: 5,
            foodY: 5,
            velocityX: 1,
            velocityY: 0,
            score: 0,
            level: 1,
            obstacles: [],
            gameLoop: null,
            bgMusicPlaying: false
        };

        
    
        scoreElement.textContent = '🍃 0';
        levelElement.textContent = 'Nível 1';
        gameOverElement.style.display = 'none';
        updateGameAreaTheme();
        spawnFood();
        generateObstacles(config.levels[1].obstacles);
        startGameLoop();
    }

    // Funções utilitárias
    const clamp = (num, min, max) => Math.max(min, Math.min(num, max));
    const randomPosition = (max) => Math.floor(Math.random() * max);
    const calculateCellSize = () => ({
        width: gameArea.clientWidth / config.gridSize,
        height: gameArea.clientHeight / config.gridHeight
    });

    initGame();
});