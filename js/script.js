document.addEventListener('DOMContentLoaded', function() {
    let move_speed = 5;
    let gravity = 0.25;
    let bird = document.querySelector('.bird');
    let img = document.getElementById('bird-1');
    let sound_point = new Audio('effect/point.mp3');
    let music = new Audio('effect/music.mp3');
    let sound_die = new Audio('effect/die.wav');
    let max_speed = 20;
    let speed_increment = 0.2;
    let sounds = [sound_point, sound_die, music];
    let pipe_creation_interval = 1500;

    const volumeSlider = document.getElementById('volume-slider');
    const muteButton = document.getElementById('mute-button');
    let isMuted = false;

    let bird_props = bird.getBoundingClientRect();
    let background = document.querySelector('.background').getBoundingClientRect();
    let score_val = document.querySelector('.score_val');
    let message = document.querySelector('.message');
    let score_title = document.querySelector('.score_title');

    let game_state = 'Start';
    let bird_dy = 0;

    img.style.display = 'none';
    message.classList.add('messageStyle');
    let selectedCharacter = null;


    const characterCards = document.querySelectorAll('.character-card');
    setupCharacterSelection();

    function setupCharacterSelection() {
        characterCards.forEach(card => {
            card.addEventListener('click', () => {
                characterCards.forEach(c => c.style.border = 'none');

                card.style.border = '2px solid purple';
                selectedCharacter = card.getAttribute('data-character');

                console.log(selectedCharacter);

            });
        });
    }

    const initialMessageContent = message.innerHTML;

    let savedVolume = localStorage.getItem('volume');
    if (savedVolume !== null) {
        volumeSlider.value = savedVolume;
        sounds.forEach(function(sound) {
            sound.volume = parseFloat(savedVolume);
        });
    } else {
        const defaultVolume = 0.3; // 30%
        volumeSlider.value = defaultVolume;
        sounds.forEach(function(sound) {
            sound.volume = defaultVolume;
        });
        localStorage.setItem('volume', defaultVolume);
    }

    volumeSlider.addEventListener('input', function(e) {
        const volume = parseFloat(e.target.value);
        sounds.forEach(function(sound) {
            sound.volume = volume;
        });
        localStorage.setItem('volume', volume);
    });

    let savedMuteStatus = localStorage.getItem('isMuted');
    if (savedMuteStatus !== null) {
        isMuted = savedMuteStatus === 'true';
        sounds.forEach(function(sound) {
            sound.muted = isMuted;
        });
        muteButton.textContent = isMuted ? '🔇' : '🔊';
    } else {
        isMuted = false;
        sounds.forEach(function(sound) {
            sound.muted = isMuted;
        });
        muteButton.textContent = '🔊';
    }

    muteButton.addEventListener('click', function() {
        isMuted = !isMuted;
        sounds.forEach(function(sound) {
            sound.muted = isMuted;
        });
        muteButton.textContent = isMuted ? '🔇' : '🔊';
        localStorage.setItem('isMuted', isMuted);
    });

    let pipe_seperation = 0;
    let pipe_gap = 45;

    let moveAnimationId;
    let gravityAnimationId;
    let pipeAnimationId;

    function startGame() {
        music.play()
        cancelAnimationFrame(moveAnimationId);
        cancelAnimationFrame(gravityAnimationId);
        cancelAnimationFrame(pipeAnimationId);

        if (selectedCharacter != null) {
            img.src = `images/${selectedCharacter}.gif`;
        } else {
            selectedCharacter = Voxel;
        }

        document.querySelectorAll('.pipe_sprite').forEach(e => e.remove());
        img.style.display = 'block';
        bird.style.top = '40vh';
        game_state = 'Play';
        message.innerHTML = '';
        message.classList.remove('messageStyle');
        score_title.innerHTML = 'Score : ';
        score_val.innerHTML = '0';
        bird_dy = 0;
        pipe_seperation = 0;

        play();
    }

    function restartGame() {
        game_state = 'Start';
        score_val.innerHTML = '0';
        bird.style.top = '40vh';
        bird_dy = 0;
        message.innerHTML = initialMessageContent;
        message.classList.add('messageStyle');
        img.style.display = 'none';

        characterCards.forEach(card => card.style.border = 'none');

        if (selectedCharacter) {
            const selectedCard = [...characterCards].find(card => card.getAttribute('data-character') === selectedCharacter);
            if (selectedCard) {
                selectedCard.style.border = '2px solid blue';
            }
        }

        cancelAnimationFrame(moveAnimationId);
        cancelAnimationFrame(gravityAnimationId);
        cancelAnimationFrame(pipeAnimationId);

        document.querySelectorAll('.pipe_sprite').forEach(e => e.remove());

        pipe_seperation = 0;

        setupCharacterSelection();
    }



    document.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if(game_state == 'Play'){
            bird_dy = -7.6;
        } else if(game_state == 'End'){
            restartGame();
        } else if(game_state == 'Start') {
            startGame();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (game_state === 'End') {
                restartGame();
                startGame();
            } else if (game_state === 'Start') {
                startGame();
            }
        }

        if ((e.key === 'ArrowUp' || e.key === ' ') && game_state === 'Play') {
            bird_dy = -7.6;
            img.src = `images/${selectedCharacter}_with_fire.gif`;

            setTimeout(() => {
                img.src = `images/${selectedCharacter}.gif`;
            }, 500);
        }
    });

    function move(){
        if(game_state != 'Play') return;

        let pipe_sprite = document.querySelectorAll('.pipe_sprite');
        pipe_sprite.forEach((element) => {
            let pipe_sprite_props = element.getBoundingClientRect();
            bird_props = bird.getBoundingClientRect();

            const hitboxMargin = 60;

            if(pipe_sprite_props.right <= 0){
                element.remove();
            } else {
                const birdLeft = bird_props.left + hitboxMargin;
                const birdRight = bird_props.right - hitboxMargin;
                const birdTop = bird_props.top + hitboxMargin;
                const birdBottom = bird_props.bottom - hitboxMargin;

                const pipeLeft = pipe_sprite_props.left;
                const pipeRight = pipe_sprite_props.right;
                const pipeTop = pipe_sprite_props.top;
                const pipeBottom = pipe_sprite_props.bottom;

                if(birdRight > pipeLeft &&
                   birdLeft < pipeRight &&
                   ((birdTop < pipeTop + pipe_sprite_props.height &&
                     birdBottom > pipeTop) ||
                    (birdBottom > pipeBottom - pipe_sprite_props.height &&
                     birdTop < pipeBottom))){
                    game_state = 'End';
                    music.pause();
                    music.currentTime = 0;
                    message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Enter to Restart';
                    message.classList.add('messageStyle');
                    img.style.display = 'none';
                    sound_die.play();
                    pipe_creation_interval = 1500;
                    move_speed = 5

                    return;
                } else {
                    if(pipe_sprite_props.right < bird_props.left &&
                       pipe_sprite_props.right + move_speed >= bird_props.left &&
                       element.increase_score == '1'){
                        score_val.innerHTML = parseInt(score_val.innerHTML) + 1;
                        sound_point.play();
                        element.increase_score = '0';
                    }
                    element.style.left = pipe_sprite_props.left - move_speed + 'px';
                }
            }
        });
        moveAnimationId = requestAnimationFrame(move);
    }

    function apply_gravity(){
        if(game_state != 'Play') return;
        bird_dy = bird_dy + gravity;

        if(bird_props.top <= 0 || bird_props.bottom >= background.bottom){
            game_state = 'End';
            message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Tap <img src="images/enterButton.png" alt="Game Over" width="45"> to Restart';
            message.classList.add('messageStyle');
            img.style.display = 'none';
            sound_die.play();


            return;
        }
        bird.style.top = bird_props.top + bird_dy + 'px';
        bird_props = bird.getBoundingClientRect();
        gravityAnimationId = requestAnimationFrame(apply_gravity);
    }

    function create_pipe() {
        if (game_state != 'Play') return;

        let lastPipeCreationTime = Date.now();

        function spawnPipe() {
            if (game_state != 'Play') return;


            const currentTime = Date.now();
            if (currentTime - lastPipeCreationTime >= pipe_creation_interval) {
                lastPipeCreationTime = currentTime;
                if(move_speed < max_speed){
                    move_speed += speed_increment
                    pipe_creation_interval = pipe_creation_interval - 10
                }

                let pipe_posi = Math.floor(Math.random() * 43) + 8;

                // Верхняя труба
                let pipe_sprite_inv = document.createElement('div');
                pipe_sprite_inv.className = 'pipe_sprite';
                pipe_sprite_inv.style.top = pipe_posi - 70 + 'vh';
                pipe_sprite_inv.style.left = '100vw';
                pipe_sprite_inv.style.transform = 'rotate(180deg)';
                pipe_sprite_inv.increase_score = '0';

                document.body.appendChild(pipe_sprite_inv);

                // Нижняя труба
                let pipe_sprite = document.createElement('div');
                pipe_sprite.className = 'pipe_sprite';
                pipe_sprite.style.top = pipe_posi + pipe_gap + 'vh';
                pipe_sprite.style.left = '100vw';
                pipe_sprite.increase_score = '1';

                document.body.appendChild(pipe_sprite);
            }

            // Продолжаем цикл
            pipeAnimationId = requestAnimationFrame(spawnPipe);
        }

        // Запускаем цикл
        pipeAnimationId = requestAnimationFrame(spawnPipe);
    }

    function play(){
        bird_props = bird.getBoundingClientRect();
        move();
        apply_gravity();
        create_pipe();
    }

    document.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });

    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.webkitTouchCallout = 'none';
});