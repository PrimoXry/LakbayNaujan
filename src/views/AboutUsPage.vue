
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="about-content">
      <!-- Background -->
      <div class="background-layer"></div>

      <!-- ABOUT US PAGE -->
      <main class="page-content">
        <section class="about-card">
          <!-- Back Button -->
          <button
            class="back-button"
            @click="goHome"
            aria-label="Go back home"
          >
            ⬅️
          </button>

          <!-- Logo -->
          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="card-logo"
          />

          <!-- About Heading -->
          <h2>About LakbayNaujan</h2>

          <p>
            LakbayNaujan is a tourism information platform designed
            to help visitors discover tourist destinations, local
            attractions, activities, and cultural experiences in
            Naujan, Oriental Mindoro.
          </p>

          <!-- Mission -->
          <h3>Our Mission</h3>

          <p>
            To make discovering Naujan easier by providing accessible
            tourism information and promoting local destinations,
            businesses, and community experiences.
          </p>

          <!-- Features -->
          <h3>System Features</h3>

          <ul>
            <li>Tourist registration and account login</li>
            <li>Information about tourist destinations</li>
            <li>Local attractions and activities</li>
            <li>Tourism information for Naujan visitors</li>
            <li>Information about local experiences and favorites</li>
          </ul>

          <!-- Developers -->
          <div class="developers-section">
            <h3>Developers</h3>

            <p class="developers-intro">
              Developed by the LakbayNaujan project team.
            </p>

            <div class="developers-list">
              <p>Aguba, Nicole Angelyn M.</p>
              <p>Ascan, Lindon</p>
              <p>Catada, Brylle Justin</p>
              <p>Dalawampu, Myreen</p>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="contact-section">
            <h3>Contact Information</h3>

            <p>
              <strong>Email:</strong>
              <a href="mailto:lakbaynaujan@gmail.com">
                lakbaynaujan@gmail.com
              </a>
            </p>

            <p>
              <strong>Contact Number:</strong>
              <a href="tel:0912345678">0912345678</a>
            </p>
          </div>
        </section>

        <!-- Footer -->
        <footer class="page-footer">
          © {{ currentYear }} LakbayNaujan. All rights reserved.
        </footer>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'

const router = useRouter()

const currentYear = computed(() => new Date().getFullYear())

function goHome() {
  router.push('/')
}
</script>

<style scoped>
/* MAIN CONTENT */
.about-content {
  --background: transparent;
  position: relative;
}

.about-content::part(scroll) {
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* BACKGROUND IMAGE */
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  background-image:
    linear-gradient(
      rgba(0, 0, 0, 0.35),
      rgba(0, 0, 0, 0.45)
    ),
    url('/images/background.jpg');

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* PAGE LAYOUT */
.page-content {
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;
  align-items: center;

  width: 100%;
  min-height: 100%;
  min-height: 100vh;
  min-height: 100dvh;

  padding: 55px 20px 28px;
  box-sizing: border-box;
}

/* ABOUT CARD */
.about-card {
  position: relative;

  width: 100%;
  max-width: 760px;
  min-width: 0;
  margin: 0 auto;

  padding: 36px 42px 24px;
  box-sizing: border-box;

  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 22px;

  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.22);

  color: #333333;
  text-align: left;

  overflow-wrap: anywhere;
}

/* BACK BUTTON */
.back-button {
  position: absolute;
  top: 18px;
  left: 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 44px;
  height: 44px;
  padding: 0;

  border: none;
  border-radius: 50%;

  background: #edf5ed;
  color: #285c35;

  font-size: 20px;
  cursor: pointer;
  touch-action: manipulation;

  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.back-button:hover {
  background: #dcebdc;
  transform: translateX(-2px);
}

.back-button:focus-visible {
  outline: 2px solid #285c35;
  outline-offset: 3px;
}

/* LOGO */
.card-logo {
  display: block;

  width: min(100%, 400px);
  height: 180px;
  max-width: 100%;

  margin: -12px auto -8px;

  object-fit: contain;
  object-position: center;
}

/* MAIN HEADING */
.about-card h2 {
  margin: 0 0 18px;

  color: #285c35;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 800;
  line-height: 1.3;
  text-align: center;
  overflow-wrap: anywhere;
}

/* SECTION HEADINGS */
.about-card h3 {
  margin: 28px 0 12px;

  color: #347344;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
  text-align: left;
  overflow-wrap: anywhere;
}

/* PARAGRAPHS */
.about-card p {
  margin: 0 0 12px;
  max-width: 620px;

  color: #555555;
  font-size: 15px;
  line-height: 1.8;
  text-align: left;
  overflow-wrap: anywhere;
}

.about-card strong {
  color: #333333;
}

/* CONTACT SECTION */
.contact-section {
  margin-top: 10px;
  min-width: 0;
}

.contact-section h3 {
  margin-top: 10px;
  margin-bottom: 12px;
}

/* CONTACT LINKS */
.about-card a {
  color: #347344;
  text-decoration: none;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.about-card a:hover {
  text-decoration: underline;
}

/* FEATURES LIST */
.about-card ul {
  display: block;

  width: 100%;
  max-width: 580px;
  margin: 0;
  padding-left: 24px;
  box-sizing: border-box;

  color: #555555;
  text-align: left;
  line-height: 1.9;
  font-size: 15px;

  overflow-wrap: anywhere;
}

.about-card li {
  padding-left: 4px;
  margin-bottom: 4px;
}

.about-card li::marker {
  color: #347344;
}

/* DEVELOPERS SECTION */
.developers-section {
  margin: 10px -42px 10px;
  padding: 22px 42px 26px;
  min-width: 0;
  box-sizing: border-box;
}

/* DEVELOPERS HEADING */
.developers-section h3 {
  margin: 0 0 10px;

  color: #347344;
  font-size: 20px;
  font-weight: 700;
  text-align: left;
}

/* DEVELOPERS INTRO */
.developers-intro {
  margin-bottom: 12px !important;
}

/* LIGHT GREEN NAME BOX */
.developers-list {
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 14px 20px;
  box-sizing: border-box;

  background: #edf6e9;
  border: 1px solid #e0ecd9;
  border-radius: 10px;

  text-align: left;
  overflow-wrap: anywhere;
}

/* DEVELOPER NAMES */
.developers-list p {
  margin: 6px 0;

  color: #385c40;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.7;
  text-align: left;
}

/* FOOTER */
.page-footer {
  position: relative;
  z-index: 1;

  width: 100%;
  margin-top: 22px;
  padding: 0 8px;
  box-sizing: border-box;

  color: #ffffff;
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);

  overflow-wrap: anywhere;
}

/* TABLETS AND SMALL LAPTOPS */
@media (max-width: 768px) {
  .page-content {
    padding: 40px 16px 24px;
  }

  .about-card {
    max-width: 680px;
    padding: 32px 26px 24px;
  }

  .card-logo {
    height: 150px;
  }

  .developers-section {
    margin-left: -26px;
    margin-right: -26px;
    padding: 22px 26px 24px;
  }
}

/* MOBILE PHONES */
@media (max-width: 480px) {
  .page-content {
    padding: 24px 12px 20px;
  }

  .about-card {
    padding: 60px 20px 24px;
    border-radius: 16px;
  }

  .back-button {
    top: 12px;
    left: 12px;
    width: 42px;
    height: 42px;
    font-size: 18px;
  }

  .card-logo {
    width: 100%;
    height: 110px;
    margin: 0 auto 12px;
  }

  .about-card h2 {
    margin-bottom: 16px;
    font-size: clamp(22px, 6vw, 25px);
  }

  .about-card h3 {
    margin-top: 24px;
    font-size: 18px;
  }

  .about-card p,
  .about-card ul {
    font-size: 14px;
    line-height: 1.75;
  }

  .about-card ul {
    padding-left: 21px;
  }

  .contact-section h3 {
    margin-top: 10px;
  }

  .developers-section {
    margin-left: -20px;
    margin-right: -20px;
    padding: 20px 20px 22px;
  }

  .developers-section h3 {
    font-size: 18px;
  }

  .developers-list {
    padding: 12px 14px;
  }

  .developers-list p {
    font-size: 14px;
  }

  .page-footer {
    margin-top: 16px;
    font-size: 11px;
  }
}

/* EXTRA SMALL PHONES */
@media (max-width: 360px) {
  .page-content {
    padding: 18px 8px 16px;
  }

  .about-card {
    padding: 58px 15px 20px;
    border-radius: 14px;
  }

  .back-button {
    top: 10px;
    left: 10px;
    width: 40px;
    height: 40px;
  }

  .card-logo {
    height: 95px;
  }

  .about-card h2 {
    font-size: 22px;
  }

  .about-card h3 {
    font-size: 17px;
  }

  .developers-section {
    margin-left: -15px;
    margin-right: -15px;
    padding: 18px 15px 20px;
  }

  .developers-list {
    padding: 12px;
  }
}

/* LANDSCAPE PHONES */
@media (max-height: 500px) and (orientation: landscape) {
  .page-content {
    padding-top: 20px;
  }

  .about-card {
    padding-top: 56px;
  }

  .card-logo {
    height: 90px;
    margin-top: 0;
  }
}

/* REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  .back-button {
    transition: none;
  }
}
</style>
