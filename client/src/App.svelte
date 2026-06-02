<script lang="ts">
  import {Route} from 'tinro'; 

  import Frontpage from './Frontpage.svelte';
  import Room from './Room.svelte';
</script>

<Route path="/"><Frontpage /></Route>
<Route path="/:room/:username" let:meta>
  <Room room={meta.params.room} username={meta.params.username} />
</Route>
