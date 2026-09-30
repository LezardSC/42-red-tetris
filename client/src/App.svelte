<script lang="ts">
  import './main.css';

  import { onDestroy } from 'svelte';
  import { connect, disconnect } from './lib/socket.svelte';
  import { goto, matchRoute, route } from './lib/router.svelte';

  import Frontpage from './Frontpage.svelte';
  import Room from './Room.svelte';

  import Header from './lib/Header.svelte';
  import TetrisBackground from './lib/TetrisBackground.svelte';

  connect();
  onDestroy(disconnect);

  const roomParams = $derived(matchRoute('/:room/:username', route.path));
  const isHome: boolean = $derived(matchRoute('/', route.path) !== null);

  // Unknown URLs go back to the front page.
  $effect(() => {
    if (!isHome && !roomParams) goto('/', true);
  });
</script>

<Header />

<div class="fixed inset-0 pointer-events-none opacity-30">
  <TetrisBackground />
</div>

{#if roomParams}
  <Room room={roomParams.room} username={roomParams.username} />
{:else if isHome}
  <Frontpage />
{/if}