
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
  gap: 14px;

  padding: 24px 40px;
}

/* Navigation buttons */
.nav-button {
  min-width: 105px;
  padding: 12px 24px;

  border: 2px solid white;
  border-radius: 30px;

  background: transparent;
  color: white;

  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;

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

/* Center the logo */
.home-screen {
  position: absolute;
  inset: 0;
  z-index: 2;

  display: flex;
  justify-content: center;
  align-items: center;

  padding: 70px 20px 20px;
  pointer-events: none;
}

/* Large centered logo */
.main-logo {
  display: block;

  width: clamp(180px, 155vw, 800px);
  max-width: 110vw;
  max-height: 98vh;

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

/* Mobile layout */
@media (max-width: 600px) {
  .top-nav {
    padding: 18px 16px;
    gap: 8px;
  }

  .nav-button {
    min-width: 88px;
    padding: 10px 16px;
    font-size: 13px;
  }

  .main-logo {
    width: 90vw;
    max-height: 65vh;
  }

  
}
</style>
