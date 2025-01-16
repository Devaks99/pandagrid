document.addEventListener('DOMContentLoaded', () => {
    const pandaElement = document.getElementById('panda');
    const foodElement = document.getElementById('food');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const pauseButton = document.getElementById('pause');
    const resetButton = document.getElementById('reset');
    const gameOverElement = document.getElementById('gameOver');
    const gameArea = document.querySelector('.game-area');

    let pandaX = 10;
    let pandaY = 10;
    let foodX = 5;
    let foodY = 5;
    let gridSize = 27;
    let gridHeight = 16;
    let cellSize = 35; // Tamanho inicial da célula
    let velocityX = 1;
    let velocityY = 0;
    let score = 0;
    let level = 1;
    let obstacles = [];
    let gamePaused = false;
    let gameLoopInterval;
    const initialInterval = 180; // Velocidade inicial ajustada para Fácil
    let currentInterval = initialInterval; // Variável para armazenar o intervalo atual

    gameArea.classList.add('level-easy'); // Adicionado para garantir a classe inicial

    pauseButton.addEventListener('click', togglePause);

    resetButton.addEventListener('click', () => {
        gameOverElement.style.display = 'none';
        resetGame();
    });

    window.addEventListener('resize', checkResponsive);
    checkResponsive(); // Verifica a responsividade inicialmente

    function checkResponsive() {
        if (window.innerWidth < 768) { // Define a largura máxima para o modo responsivo
            updateCellSize();
        } else {
            resetCellSize();
        }
    }

    function updateCellSize() {
        const gameAreaWidth = gameArea.clientWidth;
        const gameAreaHeight = gameArea.clientHeight;
        cellSize = Math.min(gameAreaWidth / gridSize, gameAreaHeight / gridHeight);
        pandaElement.style.width = `${cellSize}px`;
        pandaElement.style.height = `${cellSize}px`;
        foodElement.style.width = `${cellSize}px`;
        foodElement.style.height = `${cellSize}px`;

        for (let obstacle of obstacles) {
            obstacle.element.style.width = `${cellSize}px`;
            obstacle.element.style.height = `${cellSize}px`;
            obstacle.element.style.left = `${obstacle.x * cellSize}px`;
            obstacle.element.style.top = `${obstacle.y * cellSize}px`;
        }

        pandaElement.style.left = `${pandaX * cellSize}px`;
        pandaElement.style.top = `${pandaY * cellSize}px`;
        foodElement.style.left = `${foodX * cellSize}px`;
        foodElement.style.top = `${foodY * cellSize}px`;
    }

    function resetCellSize() {
        cellSize = 35; // Redefine o tamanho da célula para o valor inicial
        pandaElement.style.width = `${cellSize}px`;
        pandaElement.style.height = `${cellSize}px`;
        foodElement.style.width = `${cellSize}px`;
        foodElement.style.height = `${cellSize}px`;

        for (let obstacle of obstacles) {
            obstacle.element.style.width = `${cellSize}px`;
            obstacle.element.style.height = `${cellSize}px`;
            obstacle.element.style.left = `${obstacle.x * cellSize}px`;
            obstacle.element.style.top = `${obstacle.y * cellSize}px`;
        }

        pandaElement.style.left = `${pandaX * cellSize}px`;
        pandaElement.style.top = `${pandaY * cellSize}px`;
        foodElement.style.left = `${foodX * cellSize}px`;
        foodElement.style.top = `${foodY * cellSize}px`;
    }

    function gameLoop() {
        if (gamePaused) return;

        pandaX += velocityX;
        pandaY += velocityY;

        if (pandaX < 0) pandaX = 0;
        if (pandaX >= gridSize) pandaX = gridSize - 1;
        if (pandaY < 0) pandaY = 0;
        if (pandaY >= gridHeight) pandaY = gridHeight - 1;

        for (let obstacle of obstacles) {
            if (isCollision(pandaX, pandaY, obstacle.x, obstacle.y)) {
                gameOver();
                return;
            }
        }

        pandaElement.style.left = pandaX * cellSize + 'px';
        pandaElement.style.top = pandaY * cellSize + 'px';

        if (isCollision(pandaX, pandaY, foodX, foodY)) {
            do {
                foodX = Math.floor(Math.random() * gridSize);
                foodY = Math.floor(Math.random() * gridHeight);
            } while (isFoodOnObstacle(foodX, foodY) || isCollision(pandaX, pandaY, foodX, foodY));

            score++;
            scoreElement.textContent = `Pontos: ${score}`;

            if (score % 20 === 0) {
                level++;
                increaseDifficulty();
            }
        }

        foodElement.style.left = foodX * cellSize + 'px';
        foodElement.style.top = foodY * cellSize + 'px';
    }

    function isCollision(pandaX, pandaY, targetX, targetY) {
        return pandaX === targetX && pandaY === targetY;
    }

    function isFoodOnObstacle(foodX, foodY) {
        return obstacles.some(obstacle => obstacle.x === foodX && obstacle.y === foodY);
    }

    function increaseDifficulty() {
        clearInterval(gameLoopInterval);

        switch (level) {
            case 2:
                gameArea.classList.remove('level-easy');
                gameArea.classList.add('level-medium');
                gameArea.style.backgroundImage = "url('img/paisagem-fundo-deserto.png')";
                levelElement.textContent = 'Nível: Médio';
                currentInterval = 150;
                createObstacles(4); // Adiciona 4 obstáculos para o nível médio
                break;
            case 3:
                gameArea.classList.remove('level-medium');
                gameArea.classList.add('level-difficult');
                gameArea.style.backgroundImage = "url('img/paisagem-fundo-noturno.png')";
                levelElement.textContent = 'Nível: Difícil';
                currentInterval = 120;
                createObstacles(6); // Adiciona 6 obstáculos para o nível difícil
                break;
            case 4:
                gameArea.classList.remove('level-difficult');
                gameArea.classList.add('level-very-difficult');
                gameArea.style.backgroundImage = "url('img/paisagem-fundo-praia.png')";
                levelElement.textContent = 'Nível: Muito Difícil';
                currentInterval = 90;
                createObstacles(10); // Adiciona 10 obstáculos para o nível muito difícil
                break;
            default:
                currentInterval = initialInterval;
                break;
        }

        gameLoopInterval = setInterval(gameLoop, currentInterval);
    }

    function createObstacles(numObstacles) {
        obstacles = [];
        for (let i = 0; i < numObstacles; i++) {
            let obstacle;
            do {
                obstacle = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridHeight),
                    element: document.createElement('div')
                };
                obstacle.element.classList.add('obstacle');
                obstacle.element.style.width = `${cellSize}px`;
                obstacle.element.style.height = `${cellSize}px`;
                obstacle.element.style.left = `${obstacle.x * cellSize}px`;
                obstacle.element.style.top = `${obstacle.y * cellSize}px`;
                gameArea.appendChild(obstacle.element);
            } while (isFoodOnObstacle(obstacle.x, obstacle.y) || isCollision(pandaX, pandaY, obstacle.x, obstacle.y));

            obstacles.push(obstacle);
        }
    }

    function togglePause() {
        gamePaused = !gamePaused;
        if (gamePaused) {
            clearInterval(gameLoopInterval);
            pauseButton.textContent = 'Jogar';
        } else {
            gameLoopInterval = setInterval(gameLoop, currentInterval);
            pauseButton.textContent = 'Pausar';
        }
    }

    function resetGame() {
        pandaX = 10;
        pandaY = 10;
        foodX = 5;
        foodY = 5;
        score = 0;
        level = 1;
        obstacles = [];
        gamePaused = false;
        scoreElement.textContent = `Pontos: ${score}`;
        levelElement.textContent = 'Nível: Fácil';
        gameArea.classList.remove('level-medium', 'level-difficult', 'level-very-difficult');
        gameArea.classList.add('level-easy');
        gameArea.style.backgroundImage = "url('img/paisagem-fundo-selva.jpg')"; // Corrigido para a imagem inicial
        renderObstacles();
        clearInterval(gameLoopInterval); // Adicionado para garantir que o intervalo anterior seja cancelado
        currentInterval = initialInterval; // Reinicia o currentInterval
        gameLoopInterval = setInterval(gameLoop, currentInterval); // Velocidade inicial ajustada para Fácil
    }

    function gameOver() {
        clearInterval(gameLoopInterval);
        gameOverElement.style.display = 'block';
    }

    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                if (velocityY === 0) {
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY === 0) {
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX === 0) {
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX === 0) {
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
            case ' ':
                togglePause();
                break;
        }
    });

    gameLoopInterval = setInterval(gameLoop, currentInterval); // Inicialização do intervalo do game loop
});
