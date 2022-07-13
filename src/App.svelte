<script>
  let name = "world";
  let count = 1;
  let upgrade = 0;
  let price = 10;
  let exponent = 2.718282;
  let autoclickerprice = 10;
  let autocps = 1;

  function cps() {
    count += 1 + upgrade;
  }

  function oneup() {
    if (count >= price) {
      upgrade += 1;
      count -= price;
      increaseprice();
    }
  }

  function auto_oneup() {
    if (count >= autoclickerprice) {
      autocps += 1;
      count -= autoclickerprice;
      increaseautoprice();
    }
  }

  function increaseprice() {
    price *= exponent;
  }

  function increaseautoprice() {
    autoclickerprice *= exponent + 0.1415926535;
  }

  window.setInterval(function () {
    count += autocps;
  }, 1000);
</script>

<main>
  <input bind:value={name} class="nameInput" />
  <h1>Hello {name}</h1>

  <div>
    <img
      src="images/SvelteLogo.png"
      on:click={cps}
      alt="Svelte"
      class="svelte-logo"
    />
    <form>
      <h4>Clicks:</h4>
      {Math.round(count)}
    </form>
  </div>

  <div style="text-align: center;">
    <div
      style="display: inline-block; vertical-align: top; padding-right: 15px"
    >
      <form>
        <h4>Clicker upgrade price:</h4>
        {Math.round(price)}
      </form>
      <button on:click={oneup} style="margin-top: 1em;" class="learn-more">
        Upgrade
      </button>
    </div>
    <div
      style="display: inline-block; vertical-align: top; padding-left: 15px;"
    >
      <form>
        <h4>AClick upgrade price:</h4>
        {Math.round(autoclickerprice)}
      </form>
      <button on:click={auto_oneup} style="margin-top: 1em;" class="learn-more">
        Upgrade
      </button>
    </div>
  </div>

  <div class="info">
    <!-- onclick="this.parentElement.style.display='none' -->
    <p>
      Hello lad! if you need any help I'm here for you to explain what
      everything does!<br />
      - The text field above Hello world is purely cosmetic, you can type your name
      in it and it will display it instead of "World" <br />
      - The Svelte Logo or "S" is used to click on so you get more clicks and also
      there is an auto clicker that clicks for you every second
      <br />
      - There are two upgrade buttons wich grant you +1 click to either the normal
      clicks or the autoclicker but the price changes exponenitally
    </p>
    <div
      style="position: absolute; top: 10px; right: 10px; background-color: #04444E; padding: 10px; padding-left: 15px; padding-right: 15px; color: #FFDBDD; cursor: pointer"
      onclick="this.parentElement.style.display='none'"
    >
      X
    </div>
  </div>

  <h4 style="position:absolute; top: 1px; right: 30px;">
    Visit my <a href="https://foss-for-us.web.app/" target="_blank">Site</a><br
    />
    My <a href="https://github.com/Igo-Cigo" target="_blank">GitHub</a><br />
    My <a href="https://www.twitch.tv/igocigo" target="_blank">Twitch</a><br />
  </h4>

  <h4 style="position:absolute; top: 1px; left: 30px;">
    Any further questions?<br />Add me on discord <br />McJiggy's security
    checkpoint#4500
  </h4>
</main>

<style>
  .info {
    position: absolute;
    bottom: 0px;
    left: 0;
    right: 0;
    background-color: #48cac0;
    font-weight: 600;
    text-transform: uppercase;
    text-decoration: none;
  }

  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  .nameInput {
    left: 0;
    right: 0;

    margin-left: auto;
    margin-right: auto;

    position: absolute;
    width: 20%;

    outline: 1px solid black;
    background: white;
  }

  .svelte-logo {
    max-width: 250px;
    max-height: auto;
    padding-bottom: 2em;
    filter: drop-shadow(0 0.2rem 0.25rem rgba(0, 0, 0, 0.5));
    transition: transform 100ms cubic-bezier(0, 0, 0.58, 1);
  }

  .svelte-logo:active {
    transform: translateY(4px);
  }

  @import url("https://fonts.googleapis.com/css?family=Rubik:700&display=swap");
  * {
    box-sizing: border-box;
  }
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button {
    position: relative;
    display: inline-block;
    cursor: pointer;
    outline: none;
    border: 0;
    vertical-align: middle;
    text-decoration: none;
    font-size: inherit;
    font-family: inherit;
  }

  button.learn-more {
    font-weight: 600;
    color: #382b22;
    text-transform: uppercase;
    padding: 1.25em 2em;
    background: #fff0f0;
    border: 2px solid #b18597;
    border-radius: 0.75em;
    transform-style: preserve-3d;
    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1),
      background 150ms cubic-bezier(0, 0, 0.58, 1);
  }

  button.learn-more::before {
    position: absolute;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #f9c4d2;
    border-radius: inherit;
    box-shadow: 0 0 0 2px #b18597, 0 0.625em 0 0 #ffe3e2;
    transform: translate3d(0, 0.75em, -1em);

    transition: transform 150ms cubic-bezier(0, 0, 0.58, 1),
      box-shadow 150ms cubic-bezier(0, 0, 0.58, 1);
  }
  button.learn-more:hover {
    background: #ffe9e9;
    transform: translate(0, 0.25em);
  }
  button.learn-more:hover::before {
    box-shadow: 0 0 0 2px #b18597, 0 0.5em 0 0 #ffe3e2;
    transform: translate3d(0, 0.5em, -1em);
  }
  button.learn-more:active {
    background: #ffe9e9;
    transform: translate(0em, 0.75em);
  }
  button.learn-more:active::before {
    box-shadow: 0 0 0 2px #b18597, 0 0 #ffe3e2;
    transform: translate3d(0, 0, -1em);
  }
</style>
