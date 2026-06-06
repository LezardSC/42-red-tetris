<script lang="ts">
    import { onMount } from 'svelte';

    type ShapeDef = { shape: number[][]; color: string };
    type BlockDef = { r: number; c: number };
    
    // Objet classique au lieu d'une classe pour optimiser la réactivité Svelte
    type ParticleObj = {
        id: number;
        x: number;
        y: number;
        size: number;
        speed: number;
        color: string;
        rotation: number;
        rotationSpeed: number;
        maxClearance: number;
        cols: number;
        rows: number;
        blocks: BlockDef[]; // Stocke la position précalculée de chaque carré de la pièce
    };

    // On utilise $state pour lier directement la taille à l'écran
    let width = $state(0);
    let height = $state(0);
    let particles = $state<ParticleObj[]>([]);
    let animationFrameId: number;
    let lastTime: number = 0;

    const tetrominos: ShapeDef[] = [
        { shape: [[1,1,1,1]], color: '#00FFFF' },
        { shape: [[1,0,0],[1,1,1]], color: '#0066FF' },
        { shape: [[0,0,1],[1,1,1]], color: '#FF8800' },
        { shape: [[1,1],[1,1]], color: '#FFE600' },
        { shape: [[0,1,1],[1,1,0]], color: '#00FF00' },
        { shape: [[0,1,0],[1,1,1]], color: '#CC00FF' },
        { shape: [[1,1,0],[0,1,1]], color: '#FF0033' }
    ];

    // Fonction de création de particules (remplace le constructeur)
    function createParticle(initialSpawn: boolean, id: number, w: number, h: number): ParticleObj {
        const size = Math.random() * 15 + 12;
        const x = Math.random() * w;
        
        const type = tetrominos[Math.floor(Math.random() * tetrominos.length)];
        const shape = type.shape;
        const color = type.color;
        const rows = shape.length;
        const cols = shape[0].length;
        
        // On précalcule les cases pleines pour générer les <div> facilement dans le HTML
        const blocks: BlockDef[] = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (shape[r][c]) blocks.push({ r, c });
            }
        }

        const maxClearance = Math.max(rows, cols) * size;
        
        let y = 0;
        if (initialSpawn) {
            y = -(Math.random() * h * 1.5) - maxClearance;
        } else {
            y = -maxClearance - (Math.random() * 100);
        }

        return {
            id, x, y, size,
            speed: Math.random() * 0.1 + 0.05,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.002,
            maxClearance, cols, rows, blocks
        };
    }

    onMount(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        const count = Math.floor(w / 60);
        const initialParticles: ParticleObj[] = [];
        for (let i = 0; i < count; i++) {
            initialParticles.push(createParticle(true, i, w, h));
        }
        particles = initialParticles;

        function draw(time: number) {
            if (!lastTime) lastTime = time;
            const dt = time - lastTime;
            lastTime = time;

            const safeDt = Math.min(dt, 50);
            const currentHeight = height || window.innerHeight;
            const currentWidth = width || window.innerWidth;
            
            // Map renvoie un nouveau tableau, forçant Svelte à mettre à jour les positions dans le HTML
            particles = particles.map(p => {
                p.y += p.speed * safeDt;
                p.rotation += p.rotationSpeed * safeDt;

                if (p.y > currentHeight + p.maxClearance) {
                    return createParticle(false, p.id, currentWidth, currentHeight);
                }
                return p;
            });
            
            animationFrameId = requestAnimationFrame(draw);
        }

        animationFrameId = requestAnimationFrame(draw);

        return () => cancelAnimationFrame(animationFrameId);
    });
</script>

<div class="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden" bind:clientWidth={width} bind:clientHeight={height}>
    
    {#each particles as p (p.id)}
        <div 
            class="tetris-piece"
            style="
                width: {p.cols * p.size}px; 
                height: {p.rows * p.size}px; 
                transform: translate({p.x - (p.cols * p.size) / 2}px, {p.y - (p.rows * p.size) / 2}px) rotate({p.rotation}rad);
            "
        >
            {#each p.blocks as block}
                <div 
                    class="tetris-block"
                    style="
                        left: {block.c * p.size}px; 
                        top: {block.r * p.size}px; 
                        width: {p.size}px; 
                        height: {p.size}px;
                    "
                >
                    <div class="tetris-block-bg" style="background-color: {p.color}; box-shadow: 0 0 10px {p.color};"></div>
                    <div class="tetris-block-bevel"></div>
                </div>
            {/each}
        </div>
    {/each}

</div>

<style>
    /* Le conteneur principal de la pièce */
    .tetris-piece {
        position: absolute;
        top: 0; left: 0; /* Essentiel comme point de départ avant le translate GPU */
        will-change: transform; /* Indique au navigateur d'optimiser l'animation matérielle */
    }

    /* Le carré extérieur du bloc (bordure blanche) */
    .tetris-block {
        position: absolute;
        box-sizing: border-box;
        border: 1.5px solid rgba(255, 255, 255, 0.7);
    }

    /* Le remplissage néon (opacité ciblée sans effacer la bordure) */
    .tetris-block-bg {
        position: absolute;
        inset: 0;
        opacity: 0.6;
    }

    /* Le petit renfoncement noir à l'intérieur */
    .tetris-block-bevel {
        position: absolute;
        top: 1.5px; left: 1.5px; right: 1.5px; bottom: 1.5px;
        border: 1px solid rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 10;
    }
</style>