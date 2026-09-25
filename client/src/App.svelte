<script lang="ts">
  import './main.css';

  import { onDestroy } from 'svelte';
  import {Route} from 'tinro';
  import { connect, disconnect } from './lib/socket.svelte';

  import Frontpage from './Frontpage.svelte';
  import Room from './Room.svelte';
  import Debug from './Debug.svelte';

  import Header from './lib/Header.svelte';
  import TetrisBackground from './lib/TetrisBackground.svelte';

  connect();
  onDestroy(disconnect);
</script>

<Header />

<div class="fixed inset-0 pointer-events-none opacity-30">
  <TetrisBackground />
</div>

<Route path="/"><Frontpage /></Route>
<Route path="/debug"><Debug /></Route>
<Route path="/:room/:username" let:meta>
  <Room room={meta.params.room} username={meta.params.username} />
</Route>