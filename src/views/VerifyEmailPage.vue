
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="landing-content">
      <!-- Background -->
      <div class="background-layer"></div>

      <!-- Navigation -->
      <header class="top-nav">
        <button class="nav-button" @click="goHome">
          Home
        </button>
        <button class="nav-button" @click="goToLogin">
          Login
        </button>
      </header>

      <!-- Verify Email Card -->
      <main class="verify-wrapper">
        <section class="verify-card">
          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="verify-logo"
          />

          <div class="hero">
            <h1>Verify your email</h1>
            <p class="subtitle">
              One more step to get started with LakbayNaujan.
            </p>
          </div>

          <div class="info-message">
            <span class="info-icon">📩</span>
            <p>
              Check your inbox and spam folder for your confirmation email.
              Enter the verification code when it arrives.
            </p>
          </div>

          <p class="helper-text">
            No email yet? Check the address below and request another code.
            If you've already verified your email or registered with Google,
            return to login.
          </p>

          <form @submit.prevent="verify" class="verify-form">
            <div class="form-group">
              <label class="field-label">Email address</label>
              <ion-input
                v-model="email"
                class="field-input"
                type="email"
                autocomplete="email"
                :disabled="busy"
                required
                placeholder="Enter your email"
              />
            </div>

            <div class="form-group">
              <label class="field-label">Verification code</label>
              <ion-input
                v-model="token"
                class="field-input"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                :disabled="busy"
                required
                placeholder="Enter code from email"
              />
            </div>

            <p
              v-if="message"
              class="feedback"
              :class="{ error: errorState }"
              role="status"
            >
              {{ message }}
            </p>

            <ion-button
              type="submit"
              expand="block"
              class="primary-button"
              :disabled="busy"
            >
              {{
                busy
                  ? 'Checking...'
                  : 'Verify & Continue'
              }}
            </ion-button>
          </form>

          <button
            type="button"
            class="resend-button"
            :disabled="busy || retrySeconds > 0"
            @click="resend"
          >
            {{
              retrySeconds > 0
                ? `Resend in ${retrySeconds}s`
                : 'Resend verification code'
            }}
          </button>

          <div class="card-footer">
            Already verified?
            <button class="text-link" @click="goToLogin">
              Back to Login
            </button>
          </div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  onIonViewWillEnter,
  onIonViewDidLeave,
  IonPage,
  IonContent,
  IonInput,
  IonButton,
} from '@ionic/vue';

import { destinationForUser } from '../lib/auth';
import { errorMessage, logRequestError } from '../lib/errors';
import {
  emailRetrySeconds,
  resendSignupCode,
  verifySignupCode,
} from '../lib/verification';

const router = useRouter();
const route = useRoute();

const email = ref(
  typeof route.query.email === 'string'
    ? route.query.email
    : ''
);

const token = ref('');
const busy = ref(false);
const message = ref('');
const errorState = ref(false);
const clock = ref(Date.now());

const retrySeconds = computed(() => {
  void clock.value;
  return emailRetrySeconds(email.value);
});

let timer: ReturnType<typeof setInterval> | undefined;

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

function goHome() {
  router.push('/');
}

function goToLogin() {
  router.push('/login');
}

onIonViewWillEnter(() => {
  if (typeof route.query.email === 'string') {
    email.value = route.query.email;
  }

  token.value = '';
  message.value = '';
  errorState.value = false;

  stopTimer();
  clock.value = Date.now();

  timer = setInterval(() => {
    clock.value = Date.now();
  }, 1000);
});

onIonViewDidLeave(stopTimer);
onUnmounted(stopTimer);

watch(email, () => {
  token.value = '';
  message.value = '';
  errorState.value = false;
});

async function verify() {
  if (busy.value) return;

  busy.value = true;
  message.value = '';
  errorState.value = false;

  let verified = false;

  try {
    const userId = await verifySignupCode(
      email.value,
      token.value
    );

    verified = true;
    token.value = '';

    await router.replace(
      await destinationForUser(userId)
    );
  } catch (e) {
    errorState.value = true;

    message.value = verified
      ? `Your email is verified, but we could not open your account. ${errorMessage(e, 'Please return to login.')}`
      : errorMessage(e, 'Verification failed.');
  } finally {
    busy.value = false;
  }
}

async function resend() {
  if (busy.value || emailRetrySeconds(email.value) > 0) {
    return;
  }

  busy.value = true;
  message.value = '';
  errorState.value = false;

  try {
    await resendSignupCode(email.value);

    token.value = '';

    message.value =
      'Request accepted. If this address has an unverified account, check your inbox and spam folder for the latest confirmation email. Already verified? Return to login.';
  } catch (e) {
    logRequestError('resend', e);

    errorState.value = true;
    message.value = errorMessage(
      e,
      'Could not request another code.'
    );
  } finally {
    clock.value = Date.now();
    busy.value = false;
  }
}
</script>

<style scoped>
.landing-content {
  --background: transparent;
  position: relative;
  min-height: 100%;
  font-family: Arial, Helvetica, sans-serif;
}

/* Background matches Login and Sign Up */
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(
      rgba(0, 0, 0, 0.35),
      rgba(0, 0, 0, 0.35)
    ),
    url('/images/background.jpg') center / cover no-repeat;
}

/* Navigation */
.top-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 22px 34px;
}

.nav-button {
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.nav-button:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Centered card */
.verify-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 100px 20px 35px;
}

.verify-card {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
  padding: 28px 34px;
  box-sizing: border-box;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
}

/* Logo */
.verify-logo {
  display: block;
  width: 390px;
  max-width: 100%;
  height: 95px;
  object-fit: contain;
  margin: 0 auto 12px;
}

/* Heading */

/* Box behind Verify your email heading */
.hero {
  text-align: center;
  margin-bottom: 22px;
  padding: 18px 20px;

  background: #f1f8f2;
  border: 1px solid #dce9de;
  border-radius: 14px;
}

.hero h1 {
  margin: 0 0 8px;
  color: #205b3b;
  font-size: 30px;
  font-weight: 750;
  line-height: 1.25;
}

.hero .subtitle {
  margin: 0;
  color: #64736a;
  font-size: 14px;
  line-height: 1.6;
}


/* Information message */
.info-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 18px;
  border: 1px solid #dce9de;
  border-radius: 12px;
  background: #f1f8f2;
}

.info-icon {
  font-size: 23px;
  line-height: 1.3;
}

.info-message p {
  margin: 0;
  color: #355a42;
  font-size: 13px;
  line-height: 1.6;
}

.helper-text {
  margin: 0 0 20px;
  color: #69766d;
  font-size: 13px;
  line-height: 1.7;
}

/* Form */
.verify-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  display: block;
  color: #294b35;
  font-size: 14px;
  font-weight: 650;
}

.field-input {
  --background: #f5f9f6;
  --color: #26382c;
  --placeholder-color: #87958b;
  --padding-start: 15px;
  --padding-end: 15px;
  --padding-top: 13px;
  --padding-bottom: 13px;
  --highlight-color-focused: #247647;

  min-height: 48px;
  border: 1px solid #dce7de;
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 14px;
}

.field-input.ion-focused {
  border-color: #247647;
}

/* Feedback */
.feedback {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #edf7ef;
  color: #205b3b;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.feedback.error {
  background: #fff0ef;
  color: #a83232;
}

/* Primary button */
.primary-button {
  --background: #247647;
  --background-hover: #195c35;
  --background-activated: #195c35;
  --border-radius: 10px;
  --box-shadow: none;
  --color: #fff;

  height: 48px;
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: none;
}

/* Resend button */
.resend-button {
  display: block;
  width: 100%;
  margin: 12px 0 0;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: #247647;
  font-size: 14px;
  font-weight: 650;
  cursor: pointer;
}

.resend-button:hover:not(:disabled) {
  color: #195c35;
  text-decoration: underline;
}

.resend-button:disabled {
  color: #9aa69d;
  cursor: not-allowed;
}

/* Footer */
.card-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-top: 12px;
  padding-top: 18px;
  border-top: 1px solid #e6ece7;
  color: #69766d;
  font-size: 13px;
}

.text-link {
  padding: 4px;
  border: none;
  background: transparent;
  color: #247647;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.text-link:hover {
  color: #195c35;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 600px) {
  .top-nav {
    padding: 16px 18px;
  }

  .nav-button {
    padding: 9px 15px;
  }

  .verify-wrapper {
    padding: 85px 15px 25px;
  }

  .verify-card {
    width: 100%;
    max-width: 750px;
    padding: 24px 20px;
    border-radius: 20px;
  }

  .verify-logo {
    width: 350px;
    height: 90px;
    margin-bottom: 10px;
  }

  .hero h1 {
    font-size: 25px;
  }

  .info-message {
    padding: 12px;
  }
}

@media (max-width: 360px) {
  .verify-card {
    padding: 22px 15px;
  }

  .hero h1 {
    font-size: 23px;
  }
}
</style>
