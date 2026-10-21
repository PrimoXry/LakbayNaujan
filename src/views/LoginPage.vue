
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="landing-content">
      <div class="background-layer"></div>

      <!-- Top navigation -->
      <header class="top-nav">
        <button class="nav-button" @click="goHome">Home</button>
        <button class="nav-button" @click="goToSignup">Sign Up</button>
      </header>

      <!-- Login page -->
      <main class="login-wrapper">
        <section class="login-card">
          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="login-logo"
          />

          <div class="hero">
            <h1>Welcome back!</h1>
            <p>Log in to explore Naujan, Oriental Mindoro.</p>
          </div>

          <!-- Login form -->
          <form class="stack" @submit.prevent="login">
            <div class="form-field">
              <label class="field-label" for="login-email">
                Email address
              </label>

              <ion-input
                id="login-email"
                v-model="email"
                class="field-input"
                type="email"
                autocomplete="email"
                required
                placeholder="you@gmail.com"
              />
            </div>

            <div class="form-field">
              <label class="field-label" for="login-password">
                Password
              </label>

              <ion-input
                id="login-password"
                v-model="password"
                class="field-input"
                type="password"
                autocomplete="current-password"
                required
                placeholder="Enter password"
              />
            </div>

            <p v-if="message" class="feedback error" role="alert">
              {{ message }}
            </p>

            <p
              v-else-if="route.query.reason === 'session'"
              class="feedback error"
              role="alert"
            >
              We could not check your session. Please try logging in again.
            </p>

            <p
              v-else-if="route.query.reason === 'profile'"
              class="feedback error"
              role="alert"
            >
              We could not load your account permissions.
              Please try again or contact support.
            </p>

            <p v-if="needsVerification" class="verification-link">
              <router-link
                :to="{
                  path: '/verify',
                  query: { email: normalizeEmail(email) }
                }"
              >
                Verify email / request another code
              </router-link>
            </p>

            <ion-button
              type="submit"
              color="success"
              expand="block"
              class="login-button"
              :disabled="busy"
            >
              {{ busy ? 'Signing in…' : 'Log in' }}
            </ion-button>
          </form>

          <!-- Divider -->
          <div class="or-divider">
            <span>OR</span>
          </div>

          <!-- Google sign in -->
          <ion-button
            expand="block"
            color="light"
            class="google-button"
            :disabled="busy"
            @click="signInWithGoogle"
          >
            <span class="google-g" aria-hidden="true">G</span>
            Continue with Google
          </ion-button>

          <!-- Footer -->
          <p class="auth-footer">
            Don't have an account?
            <router-link to="/signup">Sign up</router-link>
          </p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
} from '@ionic/vue';

import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';
import { errorCode, errorMessage } from '../lib/errors';
import {
  isValidEmail,
  normalizeEmail,
} from '../lib/verification';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const busy = ref(false);
const message = ref('');
const needsVerification = ref(false);

function goHome() {
  router.push('/');
}

function goToSignup() {
  router.push('/signup');
}

async function login() {
  if (busy.value) return;

  message.value = '';
  needsVerification.value = false;

  if (!isValidEmail(email.value) || !password.value) {
    message.value =
      'Enter a valid email address and your password.';
    return;
  }

  busy.value = true;

  try {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: normalizeEmail(email.value),
        password: password.value,
      });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Login did not return a user.');
    }

    await router.replace(
      await destinationForUser(data.user.id)
    );
  } catch (err) {
    needsVerification.value =
      errorCode(err) === 'email_not_confirmed';

    message.value = errorMessage(
      err,
      'Unable to log in.'
    );
  } finally {
    busy.value = false;
  }
}

async function signInWithGoogle() {
  if (busy.value) return;

  busy.value = true;
  message.value = '';

  try {
    const { error } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

    if (error) throw error;
  } catch (err) {
    message.value = errorMessage(
      err,
      'Could not start Google login.'
    );

    busy.value = false;
  }
}
</script>

<style scoped>
/* Main page */
.landing-content {
  --background: transparent;
  position: relative;
  overflow-x: hidden;
}

.landing-content::part(scroll) {
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

/* Background image */
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  background-image:
    linear-gradient(
      rgba(0, 0, 0, 0.35),
      rgba(0, 0, 0, 0.35)
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
  z-index: 5;

  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  padding: 20px clamp(16px, 3.5vw, 35px);
  box-sizing: border-box;
}

.nav-button {
  min-width: 95px;
  min-height: 42px;
  padding: 10px 20px;

  border: 2px solid white;
  border-radius: 30px;

  background: transparent;
  color: white;

  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;

  cursor: pointer;
  transition: 0.25s ease;
}

.nav-button:hover {
  background: white;
  color: #176b45;
}

/* Login layout */
.login-wrapper {
  position: relative;
  z-index: 2;

  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;

  padding: 100px 24px 32px;
  box-sizing: border-box;
}

/* Login card */
.login-card {
  width: 100%;
  max-width: 520px;
  min-width: 0;
  margin: 0 auto;

  padding: 28px clamp(20px, 3.5vw, 34px);
  box-sizing: border-box;

  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 24px;

  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.25);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Logo */
.login-logo {
  display: block;
  width: 390px;
  max-width: 100%;
  height: 95px;

  object-fit: contain;
  object-position: center;
  margin: 0 auto 8px;
}

/* Heading */
.hero {
  text-align: center;
  margin-bottom: 24px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

.hero h1 {
  margin: 0 0 8px;
  color: #205b3b;
  font-size: clamp(23px, 2.5vw, 27px);
  font-weight: 800;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.hero p {
  margin: 0;
  color: #68796d;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

/* Form layout */
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  min-width: 0;
}

.field-label {
  color: #294a34;
  font-size: 13px;
  font-weight: 700;
}

/* Input colors and responsive sizing */
.field-input {
  --background: #f0f7f1;
  --color: #24372a;
  --placeholder-color: #758779;
  --placeholder-opacity: 1;

  --highlight-color-focused: #247647;
  --highlight-color-valid: #247647;
  --highlight-color-invalid: #c62828;

  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;

  display: block;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  box-sizing: border-box;

  color: #24372a;
  background: #f0f7f1;
  border: 1px solid #c8ddcc;
  border-radius: 11px;

  font-size: 16px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

/* Focused input */
.field-input.ion-focused {
  border-color: #247647;
  box-shadow: 0 0 0 2px rgba(36, 118, 71, 0.12);
}

/* Login button */
.login-button {
  --background: #247647;
  --background-hover: #195c35;
  --border-radius: 12px;
  --box-shadow: none;

  width: 100%;
  min-height: 48px;
  margin: 7px 0 0;

  font-size: 14px;
  font-weight: 700;
  text-transform: none;
}

/* OR divider */
.or-divider {
  display: flex;
  align-items: center;
  gap: 12px;

  margin: 20px 0;

  color: #758779;
  font-size: 12px;
  font-weight: 600;
}

.or-divider::before,
.or-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #dae5dc;
}

/* Google button */
.google-button {
  --border-radius: 12px;
  --color: #273b2d;
  --background: #ffffff;
  --box-shadow: none;

  width: 100%;
  min-height: 48px;
  margin: 0;

  border: 1px solid #dce7de;
  border-radius: 12px;

  font-size: 14px;
  font-weight: 600;
  text-transform: none;
}

.google-g {
  margin-right: 12px;
  color: #4285f4;
  font-size: 20px;
  font-weight: 900;
}

/* Verification link */
.verification-link {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.verification-link a {
  color: #176b45;
  font-weight: 700;
  text-decoration: none;
}

/* Footer */
.auth-footer {
  margin: 22px 0 0;
  text-align: center;
  color: #68796d;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.auth-footer a {
  color: #176b45;
  font-weight: 700;
  text-decoration: none;
}

.auth-footer a:hover,
.verification-link a:hover {
  text-decoration: underline;
}

/* Error messages */
.feedback.error {
  margin: 0;
  color: #b42318;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* Tablet */
@media (min-width: 601px) and (max-width: 1024px) {
  .top-nav {
    padding: 18px 28px;
  }

  .login-wrapper {
    padding: 96px 28px 32px;
  }

  .login-card {
    max-width: 500px;
    padding: 30px 32px;
  }

  .login-logo {
    height: 90px;
  }
}

/* Mobile */
@media (max-width: 600px) {
  .top-nav {
    padding: 14px 15px;
    gap: 8px;
  }

  .nav-button {
    min-width: 78px;
    min-height: 40px;
    padding: 9px 14px;
    font-size: 12px;
  }

  .login-wrapper {
    align-items: flex-start;
    min-height: 100vh;
    min-height: 100dvh;
    padding: 78px 14px 24px;
  }

  .login-card {
    width: 100%;
    max-width: 430px;
    padding: 23px 20px;
    border-radius: 20px;
  }

  .login-logo {
    width: 350px;
    max-width: 100%;
    height: 80px;
    margin-bottom: 12px;
  }

  .hero {
    margin-bottom: 21px;
  }

  .hero h1 {
    font-size: 23px;
  }

  .hero p {
    font-size: 13px;
  }

  .stack {
    gap: 15px;
  }

  .field-label {
    font-size: 13px;
  }

  .field-input {
    min-height: 48px;
    font-size: 16px;
  }

  .login-button,
  .google-button {
    min-height: 48px;
  }

  .or-divider {
    margin: 17px 0;
  }

  .auth-footer {
    margin-top: 18px;
  }
}

/* Extra-small phones */
@media (max-width: 380px) {
  .top-nav {
    padding: 12px;
    gap: 7px;
  }

  .nav-button {
    min-width: 70px;
    padding: 8px 11px;
    font-size: 12px;
  }

  .login-wrapper {
    padding: 72px 10px 20px;
  }

  .login-card {
    padding: 20px 15px;
    border-radius: 17px;
  }

  .login-logo {
    height: 70px;
  }

  .hero h1 {
    font-size: 22px;
  }

  .google-button {
    font-size: 12px;
  }
}

/* Short screens and landscape phones */
@media (max-height: 600px) and (orientation: landscape) {
  .login-wrapper {
    align-items: flex-start;
    padding-top: 76px;
    padding-bottom: 20px;
  }

  .login-card {
    padding-top: 18px;
    padding-bottom: 20px;
  }

  .login-logo {
    height: 55px;
    margin-bottom: 8px;
  }

  .hero {
    margin-bottom: 16px;
  }

  .hero h1 {
    font-size: 22px;
  }

  .stack {
    gap: 12px;
  }

  .or-divider {
    margin: 13px 0;
  }

  .auth-footer {
    margin-top: 14px;
  }
}
</style>
