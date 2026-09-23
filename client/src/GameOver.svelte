<script lang="ts">
type Outcome = 'victory' | 'defeat' | 'solo';

let { username, winner, solo, onReplay, onQuit }: {
    username: string;
    // Payload of `game:over`: last player alive, or null (solo top-out / nobody left)
    winner: string | null;
    solo: boolean;
    onReplay: () => void;
    onQuit: () => void;
} = $props();

function outcomeOf(name: string, winnerName: string | null, isSolo: boolean): Outcome {
    if (isSolo) return 'solo';
    return winnerName === name ? 'victory' : 'defeat';
}

const TITLES: Record<Outcome, string> = {
    victory: 'Victory!',
    defeat: 'Defeat',
    solo: 'Game over',
};

const outcome: Outcome = $derived(outcomeOf(username, winner, solo));
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
    <section class="glass-panel pop-in flex flex-col items-center gap-6 text-center w-full max-w-md {outcome}">
        <h2 id="game-over-title" class="result-title m-0">{TITLES[outcome]}</h2>

        <p class="text-slate-300">
            {#if outcome === 'victory'}
                You are the last one standing.
            {:else if outcome === 'solo'}
                The stack reached the top.
            {:else if winner}
                <strong class="text-amber-400">{winner}</strong> won this round.
            {:else}
                Nobody survived this round.
            {/if}
        </p>

        <div class="flex flex-col sm:flex-row gap-3 w-full justify-center">
            <button class="arcade-btn btn-red" onclick={onQuit}>Quit</button>
            <button class="arcade-btn btn-cyan" onclick={onReplay}>Back to room</button>
        </div>
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

    .victory {
        @apply border-amber-400/60 shadow-[0_0_40px_rgba(251,191,36,0.25)];
    }
    .victory .result-title {
        @apply text-amber-400;
        text-shadow: 0 0 12px rgba(251, 191, 36, 0.7);
    }

    .defeat {
        @apply border-red-500/60 shadow-[0_0_40px_rgba(255,0,51,0.25)];
    }
    .defeat .result-title {
        @apply text-red-400;
        text-shadow: 0 0 12px rgba(255, 0, 51, 0.7);
    }

    .solo {
        @apply border-cyan-500/60 shadow-[0_0_40px_rgba(0,255,255,0.2)];
    }
    .solo .result-title {
        @apply text-cyan-400;
        text-shadow: 0 0 12px rgba(0, 255, 255, 0.7);
    }

    .pop-in {
        animation: pop-in 0.35s ease-out;
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

    .btn-cyan {
        @apply bg-slate-800 text-cyan-400 border-cyan-500/30;
    }
    .btn-cyan:hover {
        @apply border-cyan-400 bg-cyan-950 shadow-[0_0_15px_rgba(0,255,255,0.3)];
    }

    .btn-red {
        @apply bg-slate-800 text-red-400 border-red-500/30;
    }
    .btn-red:hover {
        @apply border-red-400 bg-red-950 shadow-[0_0_15px_rgba(255,0,51,0.3)];
    }
</style>
