<script>
    import {Route,router,active} from 'tinro'; 
    import Contacts from './Contacts.svelte'; // <h1>Contacts</h1>
</script> 
 
<nav>
		<!-- 
			REPL handles links to open in new window, that is why we use `/#/` here.
			Use common links (like "/contacts") in your app even in case of hash-navigation method.
		-->
    <a href="/#/" use:active exact>Home</a>
    <a href="/#/portfolio" use:active>Portfolio</a>
    <a href="/#/contacts" use:active>Contacts</a>
</nav>
 
<Route path="/"><h1>It is main page</h1></Route>
<Route path="/portfolio/*">
    <Route path="/">
        <h1>Portfolio introduction</h1>
        <nav>
            <a href="/#/portfolio/sites">Sites</a> 
            <a href="/#/portfolio/photos">Photos</a>
        </nav>
    </Route>
    <Route path="/sites"><h1>Portfolio: Sites</h1></Route>
    <Route path="/photos"><h1>Portfolio: Photos</h1></Route>
</Route>
<Route path="/contacts"><Contacts /></Route>

<style>
	:global(.active){font-weight: bold; text-decoration: underline}
	a {outline : none}
</style>