<script lang="ts">
let { onQuit }: { onQuit: () => void } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
    <section class="glass-panel pop-in flex flex-col items-center gap-6 text-center w-full max-w-md defeat">
        <h2 id="game-over-title" class="result-title m-0">Defeat</h2>

        <p class="text-slate-300">
            The stack reached the top. Wait for the round to end to play again<span class="dots"></span>
        </p>

        <button class="arcade-btn btn-red" onclick={onQuit}>Leave</button>
    </section>
</div>

<style>
    @reference "./main.css";

    .glass-panel {
        @apply bg-slate-900/90 border rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl;
    }

    .result-title {
        font-family: 'Press Start 2P', system-ui, sans-serif;
        font-size: 1.75rem;
        letter-spacing: 2px;
        line-height: 1.4;
    }

    .defeat {
        @apply border-red-500/60 shadow-[0_0_40px_rgba(255,0,51,0.25)];
    }
    .defeat .result-title {
        @apply text-red-400;
        text-shadow: 0 0 12px rgba(255, 0, 51, 0.7);
    }

    .pop-in {
        animation: pop-in 0.35s ease-out;
    }

    .dots::after {
        content: '';
        animation: dots 1.5s steps(4, end) infinite;
    }

    @keyframes dots {
        0%   { content: ''; }
        25%  { content: '.'; }
        50%  { content: '..'; }
        75%  { content: '...'; }
    }

    @keyframes pop-in {
        from { opacity: 0; transform: scale(0.85); }
        to   { opacity: 1; transform: scale(1); }
    }

    .arcade-btn {
        @apply font-bold rounded-lg px-6 py-3 transition-all duration-200 border;
        font-family: system-ui, sans-serif;
        letter-spacing: 0.5px;
    }

    .btn-red {
        @apply bg-slate-800 text-red-400 border-red-500/30;
    }
    .btn-red:hover {
        @apply border-red-400 bg-red-950 shadow-[0_0_15px_rgba(255,0,51,0.3)];
    }
</style>
