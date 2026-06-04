<script lang="ts">
    import TetrisHeader from './TetrisHeader.svelte';
</script>

<div class="fixed inset-0 bg-slate-950/80 z-[-1]"></div>

<div class="w-full pt-8 pb-6 flex justify-center relative z-10">
    <header class="relative overflow-hidden bg-slate-900/80 border border-slate-700/60 rounded-3xl px-16 py-10 backdrop-blur-md shadow-2xl">
        
        <TetrisHeader />
        
        <h1 class="arcade-title text-center select-none cursor-default m-0 relative z-10">
            <span class="neon-red">R<span class="flicker">E</span>D</span><span class="neon-cyan">-TETRIS</span>
        </h1>
    </header>
</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    .arcade-title {
        font-family: 'Press Start 2P', system-ui, sans-serif;
        font-size: 2.5rem; 
        letter-spacing: 2px;
        line-height: 1; 
    }

    .neon-red {
        color: #ffffff;
        text-shadow:
            0 0 5px #fff,
            0 0 10px #fff,
            0 0 20px #ff0033,
            0 0 40px #ff0033,
            0 0 80px #ff0033;
    }

    .neon-cyan {
        color: #ffffff;
        text-shadow:
            0 0 5px #fff,
            0 0 10px #fff,
            0 0 20px #00ffff,
            0 0 40px #00ffff,
            0 0 80px #00ffff;
    }

    .flicker {
        animation: flicker-anim 4s infinite alternate;
    }

    @keyframes flicker-anim {
        0%, 18%, 22%, 25%, 53%, 57%, 100% {
            color: #ffffff;
            text-shadow:
                0 0 5px #fff,
                0 0 10px #fff,
                0 0 20px #ff0033,
                0 0 40px #ff0033,
                0 0 80px #ff0033;
        }
        20%, 24%, 55% {
            color: #4a000d;
            text-shadow: none;
        }
    }

    @media (max-width: 640px) {
        .arcade-title {
            font-size: 1.5rem;
        }
        header {
            padding: 1.5rem 2rem;
        }
    }
</style>