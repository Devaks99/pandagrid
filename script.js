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
        gridSize: 25,
        gridHeight: 15,
        baseSpeed: 300,  // Velocidade inicial
        speedIncreasePerLevel: 0.95, // 5% mais rápido a cada nível
        levels: {
            1: { obstacles: 3, theme: 'jungle' },
            2: { obstacles: 5, theme: 'desert' },
            3: { obstacles: 7, theme: 'night' },
            4: { obstacles: 9, theme: 'beach' },
            5: { obstacles: 12, theme: 'jungle' }
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
        bgMusicPlaying: false,
        currentSpeed: config.baseSpeed,
        isSpeedBoosted: false,
        speedModifier: 1,
        speedTimeout: null
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
        state.gameLoop = setInterval(gameLoop, state.currentSpeed);
    }

    function gameLoop() {
        if (state.isPaused) return;
        
        movePanda();
        checkCollisions();
        updatePositions();
        checkLevelUp();
    }

    function movePanda() {
        const newX = state.pandaX + state.velocityX;
        const newY = state.pandaY + state.velocityY;
        
        state.pandaX = clamp(newX, 0, config.gridSize - 1);
        state.pandaY = clamp(newY, 0, config.gridHeight - 1);
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
        const gameAreaRect = gameArea.getBoundingClientRect();
        
        // Ajustar posições considerando o container
        const adjustX = (gameAreaRect.width - (config.gridSize * cellSize.width)) / 2;
        const adjustY = (gameAreaRect.height - (config.gridHeight * cellSize.height)) / 2;

        // Atualizar posição do Panda
        panda.style.transform = `translate(
            ${adjustX + (state.pandaX * cellSize.width)}px, 
            ${adjustY + (state.pandaY * cellSize.height)}px
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

    function applySpeedBoost() {
        if (state.speedTimeout) clearTimeout(state.speedTimeout);
        
        state.speedModifier = 0.7; // 30% mais rápido
        state.isSpeedBoosted = true;
        updateGameSpeed();
        
        state.speedTimeout = setTimeout(() => {
            state.speedModifier = 1;
            state.isSpeedBoosted = false;
            updateGameSpeed();
        }, 5000);
    }

  // função updateGameSpeed para garantir o cálculo correto
function updateGameSpeed() {
    const effectiveSpeed = Math.max(
        config.baseSpeed * 
        Math.pow(config.speedIncreasePerLevel, state.level - 1) *
        state.speedModifier,
        50 // Velocidade mínima de segurança
    );
    
    state.currentSpeed = effectiveSpeed;
    startGameLoop();
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
        updateGameSpeed(); // Atualiza a velocidade ao subir de nível
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
        if (state.speedTimeout) clearTimeout(state.speedTimeout); // Limpar timer do boost

         // Reiniciar estado COMPLETO
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
            bgMusicPlaying: false,
            currentSpeed: config.baseSpeed, // Reiniciar velocidade base
        isSpeedBoosted: false,
        speedModifier: 1, // Resetar modificador
        speedTimeout: null
        };

        
        scoreElement.textContent = '🍃 0';
        levelElement.textContent = 'Nível 1';
        gameOverElement.style.display = 'none';
        
        // Limpar obstáculos antigos
    gameArea.querySelectorAll('.obstacle').forEach(obs => obs.remove());

     // Reiniciar elementos do jogo
        updateGameAreaTheme();
        spawnFood();
        generateObstacles(config.levels[1].obstacles);
        startGameLoop();

         // Reiniciar música e loop
    bgMusic.pause();
    bgMusic.currentTime = 0;
    startGameLoop();
    }

    // Funções utilitárias
    const clamp = (num, min, max) => Math.max(min, Math.min(num, max));
    const randomPosition = (max) => Math.floor(Math.random() * max);
    const calculateCellSize = () => {
        const gameAreaWidth = gameArea.offsetWidth;
        const gameAreaHeight = gameArea.offsetHeight;
        
        return {
            width: gameAreaWidth / config.gridSize,
            height: gameAreaHeight / config.gridHeight
        };
    };

   // Controles Mobile melhorados
   function setupMobileControls() {
    const controls = {
        upBtn: document.getElementById('upBtn'),
        downBtn: document.getElementById('downBtn'),
        leftBtn: document.getElementById('leftBtn'),
        rightBtn: document.getElementById('rightBtn')
    };

    const handleMobileInput = (dx, dy) => {
        if (state.isPaused) return;
        state.velocityX = dx;
        state.velocityY = dy;
    };

 // Eventos de toque
 const addMobileControl = (element, direction) => {
    const directions = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
    };

    const handleEvent = (e) => {
        e.preventDefault();
        handleMobileInput(...directions[direction]);
    };

    element.addEventListener('touchstart', handleEvent);
    element.addEventListener('mousedown', handleEvent);
};

addMobileControl(controls.upBtn, 'up');
addMobileControl(controls.downBtn, 'down');
addMobileControl(controls.leftBtn, 'left');
addMobileControl(controls.rightBtn, 'right');
}


// Inicialização do jogo
    initGame();
    
    // Inicializar controles
    setupMobileControls();
});