
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="landing-content">
      <!-- Same background as signup page -->
      <div class="background-layer"></div>

      <!-- Top navigation -->
      <header class="top-nav">
        <button class="nav-button" @click="goHome">Home</button>
        <button class="nav-button" @click="goToSignup">Sign Up</button>
      </header>

      <!-- Login page -->
      <main class="login-wrapper">
        <section class="login-card">
          <!-- Logo -->
          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="login-logo"
          />

          <!-- Heading -->
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
}

/* Same background image as signup */
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;

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
  gap: 12px;

  padding: 20px 35px;
}

.nav-button {
  min-width: 95px;
  padding: 11px 20px;

  border: 2px solid white;
  border-radius: 30px;

  background: transparent;
  color: white;

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;
  transition: 0.25s ease;
}

.nav-button:hover {
  background: white;
  color: #176b45;
}

/* Center login card */
.login-wrapper {
  position: relative;
  z-index: 2;

  display: flex;
  justify-content: center;
  align-items: center;

  min-height: 100%;
  width: 100%;

  padding: 85px 20px 30px;
  box-sizing: border-box;
}

/* White rounded card */
.login-card {
  width: 100%;
  max-width: 520px;

  padding: 28px 34px;

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
  font-size: 27px;
  font-weight: 800;
}

.hero p {
  margin: 0;
  color: #68796d;
  font-size: 13px;
  line-height: 1.5;
}

/* Form */
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  color: #294a34;
  font-size: 13px;
  font-weight: 700;
}

.field-input {
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  --placeholder-color: #89968c;

  color: #24372a;
  font-size: 14px;

  border: 1px solid #dce7de;
  border-radius: 11px;
  background: #f5f9f6;

  min-height: 45px;
}

/* Login button */
.login-button {
  --background: #247647;
  --background-hover: #195c35;
  --border-radius: 12px;
  --box-shadow: none;

  height: 48px;
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

  height: 48px;
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
}

/* Mobile responsive */
@media (max-width: 600px) {
  .top-nav {
    padding: 14px 15px;
    gap: 8px;
  }

  .nav-button {
    min-width: 78px;
    padding: 9px 14px;
    font-size: 12px;
  }

  .login-wrapper {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  box-sizing: border-box;
}

 .login-card {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  padding: 28px 34px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  box-sizing: border-box;
}

  .login-logo {
    width: 350px;
    max-width: 100%;
    height: 90px;
    margin-bottom: 12px;
  }

  .hero h1 {
    font-size: 23px;
  }
}
</style>
