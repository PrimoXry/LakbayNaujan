
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="landing-content">
      <!-- Background Image -->
      <div class="background-layer"></div>

      <!-- Navigation -->
      <header class="top-nav">
        <button class="nav-button" @click="goToSignup">
          Sign Up
        </button>

        <button class="nav-button" @click="goToAbout">
          About Us
        </button>
      </header>

      <!-- Centered Logo -->
      <main class="home-screen">
        <img
          src="/images/logo.png"
          alt="LakbayNaujan Logo"
          class="main-logo"
        />
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
} from '@ionic/vue';

const router = useRouter();

function goToSignup() {
  router.push('/signup');
}

function goToAbout() {
  router.push('/about');
}
</script>

<style scoped>
.landing-content {
  --background: transparent;
  position: relative;
  width: 100%;
  height: 100%;
}

/* Full-screen background */
.background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;

  background-image:
    linear-gradient(
      rgba(0, 0, 0, 0.20),
      rgba(0, 0, 0, 0.20)
    ),
    url('/images/background.jpg');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* Top navigation */
.top-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;

  padding: 24px 40px;
  box-sizing: border-box;
}

/* Navigation buttons */
.nav-button {
  min-width: 105px;
  min-height: 44px;
  padding: 12px 24px;

  border: 2px solid white;
  border-radius: 30px;

  background: transparent;
  color: white;

  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;

  white-space: nowrap;
  cursor: pointer;

  transition:
    background 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease;
}

.nav-button:hover {
  background: white;
  color: #245c3a;
  transform: translateY(-2px);
}

.nav-button:focus-visible {
  outline: 3px solid white;
  outline-offset: 3px;
}

/* Center the logo */
.home-screen {
  position: absolute;
  inset: 0;
  z-index: 2;

  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  min-height: 100%;
  padding: 85px 24px 24px;
  box-sizing: border-box;

  pointer-events: none;
}

/* Responsive centered logo */
.main-logo {
  display: block;

  width: min(80vw, 800px);
  max-width: 100%;
  max-height: 75vh;
  max-height: 75dvh;
  height: auto;

  object-fit: contain;

  filter: drop-shadow(
    0 8px 18px rgba(0, 0, 0, 0.25)
  );

  animation: logoAppear 0.8s ease-out;
}

@keyframes logoAppear {
  from {
    opacity: 0;
    transform: scale(0.92);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Prevent scrolling */
ion-content.landing-content::part(scroll) {
  overflow: hidden;
}

/* Tablets */
@media (min-width: 601px) and (max-width: 1024px) {
  .top-nav {
    padding: 22px 28px;
    gap: 12px;
  }

  .nav-button {
    min-width: 100px;
    padding: 11px 20px;
    font-size: 14px;
  }

  .home-screen {
    padding: 80px 28px 24px;
  }

  .main-logo {
    width: min(84vw, 700px);
    max-height: 72vh;
    max-height: 72dvh;
  }
}

/* Mobile layout */
@media (max-width: 600px) {
  .top-nav {
    padding: 16px;
    gap: 8px;
  }

  .nav-button {
    min-width: 0;
    min-height: 42px;
    padding: 9px 15px;
    font-size: 13px;
    letter-spacing: 0.2px;
  }

  .home-screen {
    padding: 75px 16px 20px;
  }

  .main-logo {
    width: 90vw;
    max-width: 100%;
    max-height: 65vh;
    max-height: 65dvh;
  }
}

/* Small mobile screens */
@media (max-width: 380px) {
  .top-nav {
    padding: 12px;
    gap: 7px;
  }

  .nav-button {
    padding: 8px 12px;
    font-size: 12px;
  }

  .home-screen {
    padding: 68px 12px 16px;
  }

  .main-logo {
    width: 94vw;
    max-height: 60vh;
    max-height: 60dvh;
  }
}

/* Landscape phones and short screens */
@media (max-height: 500px) and (orientation: landscape) {
  .top-nav {
    padding: 10px 16px;
  }

  .nav-button {
    min-height: 38px;
    padding: 7px 14px;
  }

  .home-screen {
    padding: 58px 16px 12px;
  }

  .main-logo {
    width: min(65vw, 600px);
    max-height: 75vh;
    max-height: 75dvh;
  }
}

/* Respect reduced-motion settings */
@media (prefers-reduced-motion: reduce) {
  .main-logo {
    animation: none;
  }

  .nav-button {
    transition: none;
  }
}
</style>
