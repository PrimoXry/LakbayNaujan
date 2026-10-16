
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="landing-content">
      <!-- Same background as homepage -->
      <div class="background-layer"></div>

      <!-- Top navigation -->
      <header class="top-nav">
        <button class="nav-button" @click="goHome">Home</button>
        <button class="nav-button" @click="goToLogin">Login</button>
      </header>

      <!-- Signup page -->
      <main class="signup-wrapper">
        <section class="signup-card">
          <!-- Logo -->
          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="signup-logo"
          />

          <div class="hero">
            <h1>Create an account</h1>
            <p>Join LakbayNaujan and discover Naujan's destinations.</p>
          </div>

          <form class="stack" @submit.prevent="signup">
            <div class="form-field">
              <label class="field-label" for="signup-username">
                Username
              </label>
              <ion-input
                id="signup-username"
                v-model="username"
                class="field-input"
                autocomplete="username"
                required
                minlength="3"
                maxlength="30"
                placeholder="3–30 letters, numbers or underscores"
              />
            </div>

            <div class="form-field">
              <label class="field-label" for="signup-email">
                Email address
              </label>
              <ion-input
                id="signup-email"
                v-model="email"
                class="field-input"
                type="email"
                autocomplete="email"
                required
                placeholder="you@gmail.com"
              />
            </div>

            <div class="form-field">
              <label class="field-label" for="signup-password">
                Password
              </label>
              <ion-input
                id="signup-password"
                v-model="password"
                class="field-input"
                type="password"
                autocomplete="new-password"
                required
                placeholder="At least 8 characters"
              />
            </div>

            <div class="form-field">
              <label class="field-label" for="signup-confirm">
                Confirm password
              </label>
              <ion-input
                id="signup-confirm"
                v-model="confirmPassword"
                class="field-input"
                type="password"
                autocomplete="new-password"
                required
                placeholder="Repeat your password"
              />
            </div>

            <p v-if="message" class="feedback error" role="alert">
              {{ message }}
            </p>

            <ion-button
              color="success"
              expand="block"
              type="submit"
              class="signup-button"
              :disabled="busy"
            >
              {{ busy ? 'Creating account…' : 'Create Account' }}
            </ion-button>
          </form>

          <div class="or-divider">
            <span>OR</span>
          </div>

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

          <p class="muted auth-footer">
            Already have an account?
            <router-link to="/login">Log in</router-link>
          </p>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
} from '@ionic/vue';

import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';
import { errorMessage, logRequestError } from '../lib/errors';
import {
  isValidEmail,
  markEmailRequested,
  normalizeEmail,
} from '../lib/verification';

const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const busy = ref(false);
const message = ref('');

function goHome() {
  router.push('/');
}

function goToLogin() {
  router.push('/login');
}

async function signup() {
  if (busy.value) return;

  message.value = '';

  const cleanUsername = username.value.trim();
  const cleanEmail = normalizeEmail(email.value);

  if (!/^[A-Za-z0-9_]{3,30}$/.test(cleanUsername)) {
    message.value =
      'Username must be 3–30 letters, numbers or underscores.';
    return;
  }

  if (!isValidEmail(cleanEmail)) {
    message.value = 'Enter a valid email address.';
    return;
  }

  if (password.value.length < 8) {
    message.value = 'Password must contain at least 8 characters.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    message.value = 'Passwords do not match.';
    return;
  }

  busy.value = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password.value,
      options: {
        data: {
          username: cleanUsername,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error(
        'Sign-up did not return an account. Please try again.'
      );
    }

    if (data.session) {
      await router.replace(
        await destinationForUser(data.user.id)
      );
    } else {
      markEmailRequested(cleanEmail);

      await router.replace({
        path: '/verify',
        query: { email: cleanEmail },
      });
    }
  } catch (err) {
    logRequestError('signup', err);
    message.value = errorMessage(err, 'Sign-up failed.');
  } finally {
    busy.value = false;
  }
}

async function signInWithGoogle() {
  if (busy.value) return;

  busy.value = true;
  message.value = '';

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) throw error;
  } catch (err) {
    logRequestError('Google sign-in', err);
    message.value = errorMessage(
      err,
      'Could not start Google sign-in.'
    );
    busy.value = false;
  }
}
</script>


<style scoped>
.landing-content {
  --background: transparent;
  position: relative;
}

/* Background image */
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

/* Center signup card */
.signup-wrapper {
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

/* Signup card */
.signup-card {
  width: 100%;
  max-width: 750px;
  padding: 28px 34px;
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Logo - slightly larger */
.signup-logo {
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
  margin-bottom: 22px;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}

.hero h1 {
  margin: 0 0 8px;
  color: #205b3b;
  font-size: 27px;
  font-weight: 800;
  background: transparent;
}

.hero p {
  margin: 0;
  color: #68796d;
  font-size: 13px;
  line-height: 1.5;
  background: transparent;
}

/* Form layout */
.stack {
  display: flex;
  flex-direction: column;
  gap: 15px;
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

/* Main signup button */
.signup-button {
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
  margin: 17px 0;
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

  height: 46px;
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

/* Footer and feedback */
.auth-footer {
  margin: 20px 0 0;
  text-align: center;
  color: #68796d;
  font-size: 13px;
}

.auth-footer a {
  color: #176b45;
  font-weight: 700;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

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

  .signup-wrapper {
    align-items: flex-start;
    padding: 76px 14px 24px;
  }

  .signup-card {
    max-width: 430px;
    padding: 23px 20px;
    border-radius: 20px;
  }

  /* Slightly larger logo on mobile */
  .signup-logo {
    width: 350px;
    max-width: 100%;
    height: 90px;
    object-fit: contain;
    margin: 0 auto 12px;
  }

  .hero h1 {
    font-size: 23px;
  }
}
</style>
