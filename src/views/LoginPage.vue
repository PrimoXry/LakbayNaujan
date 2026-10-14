
<template>
  <ion-page>
    <ion-content :fullscreen="true" class="landing-content">
      <!-- Background -->
      <div class="background-layer"></div>

      <!-- Navigation -->
      <header class="top-nav">
        <button class="nav-button" @click="openSignup">
          Sign Up
        </button>

        <button class="nav-button" @click="openAbout">
          About Us
        </button>
      </header>

      <!-- HOME PAGE -->
      <main v-if="currentView === 'home'" class="home-screen">
        <img
          src="/images/logo.png"
          alt="LakbayNaujan Logo"
          class="main-logo"
        />

      </main>

      <!-- SIGN UP PAGE -->
      <main v-else-if="currentView === 'signup'" class="page-content">
        <section class="auth-card">
          <button class="back-button" @click="goHome">
            ⬅️
          </button>

          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="card-logo"
          />

          <h2>Create Account</h2>

          <p class="subtitle">
            Register to explore Naujan, Oriental Mindoro.
          </p>

          <form @submit.prevent="signUp">
            <label for="signup-name">Full Name</label>
            <input
              id="signup-name"
              v-model.trim="fullName"
              type="text"
              placeholder="Enter your full name"
              autocomplete="name"
              required
            />

            <label for="signup-email">Email Address</label>
            <input
              id="signup-email"
              v-model.trim="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              required
            />

            <label for="signup-contact">Contact Number</label>
            <input
              id="signup-contact"
              v-model.trim="contactNumber"
              type="tel"
              placeholder="Enter your contact number"
              autocomplete="tel"
              required
            />

            <label for="visitor-type">Where are you from?</label>
            <select
              id="visitor-type"
              v-model="visitorType"
              required
            >
              <option value="" disabled>Select your location</option>
              <option value="Naujan resident">
                Resident of Naujan
              </option>
              <option value="Outside Naujan">
                From outside Naujan
              </option>
            </select>

            <!-- For Naujan residents -->
            <template v-if="visitorType === 'Naujan resident'">
              <label for="signup-barangay">Barangay</label>
              <input
                id="signup-barangay"
                v-model.trim="barangay"
                type="text"
                placeholder="Enter your barangay"
                required
              />
            </template>

            <!-- For visitors outside Naujan -->
            <template v-if="visitorType === 'Outside Naujan'">
              <label for="signup-city">City / Municipality</label>
              <input
                id="signup-city"
                v-model.trim="homeCity"
                type="text"
                placeholder="Enter your city or municipality"
                required
              />

              <label for="signup-province">Province</label>
              <input
                id="signup-province"
                v-model.trim="province"
                type="text"
                placeholder="Enter your province"
                required
              />
            </template>

            <label for="signup-password">Password</label>
            <input
              id="signup-password"
              v-model="password"
              type="password"
              placeholder="Create a password (at least 6 characters)"
              autocomplete="new-password"
              minlength="6"
              required
            />

            <label for="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              autocomplete="new-password"
              required
            />

            <p
              v-if="message"
              class="feedback"
              :class="messageType"
              role="status"
            >
              {{ message }}
            </p>

            <button
              class="primary-button full-button"
              type="submit"
              :disabled="busy"
            >
              {{ busy ? 'Please wait...' : 'Create Account' }}
            </button>
          </form>

          <div class="separator">
            <span>OR</span>
          </div>

          <button
            class="google-button"
            :disabled="busy"
            @click="signInWithGoogle"
          >
            Continue with Google
          </button>

          <p class="switch-text">
            Already have an account?
            <button class="text-button" @click="openLogin">
              Log in
            </button>
          </p>
        </section>
      </main>

      <!-- LOGIN PAGE -->
      <main v-else-if="currentView === 'login'" class="page-content">
        <section class="auth-card">
          <button class="back-button" @click="goHome">
            ⬅️
          </button>

          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="card-logo"
          />

          <h2>Welcome Back!</h2>

          <p class="subtitle">
            Log in to continue your Naujan journey.
          </p>

          <form @submit.prevent="login">
            <label for="login-email">Email Address</label>
            <input
              id="login-email"
              v-model.trim="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              required
            />

            <label for="login-password">Password</label>
            <input
              id="login-password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />

            <p
              v-if="message"
              class="feedback"
              :class="messageType"
              role="status"
            >
              {{ message }}
            </p>

            <button
              class="primary-button full-button"
              type="submit"
              :disabled="busy"
            >
              {{ busy ? 'Logging in...' : 'Log In' }}
            </button>
          </form>

          <div class="separator">
            <span>OR</span>
          </div>

          <button
            class="google-button"
            :disabled="busy"
            @click="signInWithGoogle"
          >
            Continue with Google
          </button>

          <p class="switch-text">
            Don't have an account?
            <button class="text-button" @click="openSignup">
              Sign Up
            </button>
          </p>
        </section>
      </main>

      <!-- ABOUT US PAGE -->
      <main v-else-if="currentView === 'about'" class="page-content">
        <section class="about-card">
          <button class="back-button" @click="goHome">
            ⬅️
          </button>

          <img
            src="/images/logo.png"
            alt="LakbayNaujan Logo"
            class="card-logo"
          />

          <h2>About LakbayNaujan</h2>

          <p>
            LakbayNaujan is a tourism information platform designed
            to help visitors discover tourist destinations, local
            attractions, activities, and cultural experiences in
            Naujan, Oriental Mindoro.
          </p>

          <h3>Our Mission</h3>
          <p>
            To make discovering Naujan easier by providing accessible
            tourism information and promoting local destinations,
            businesses, and community experiences.
          </p>

          <h3>System Features</h3>
          <ul>
            <li>Tourist registration and account login</li>
            <li>Information about tourist destinations</li>
            <li>Local attractions and activities</li>
            <li>Tourism information for Naujan visitors</li>
            <li>Information about local experiences and favorites</li>
          </ul>

          <h3>Developers</h3>
          <p>
            Developed by the LakbayNaujan project team.
          </p>
          <p class="placeholder-note">
            Aguba, Nicole Angelyn M.
          </p>
          <p class="placeholder-note">Ascan, Lindon</p>
          <p class="placeholder-note">Catada, Brylle Justin</p>
          <p class="placeholder-note">Dalawampu, Myreen</p>

          <h3>Contact Information</h3>
          <p>Email: lakbaynaujan@gmail.com</p>
          <p>Contact Number: 0912345678</p>

          <button
            class="primary-button full-button"
            @click="openSignup"
          >
            Join LakbayNaujan
          </button>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';

import { supabase } from '../lib/supabase';
import { destinationForUser } from '../lib/auth';
import { errorCode, errorMessage } from '../lib/errors';
import { isValidEmail, normalizeEmail } from '../lib/verification';

type PageView = 'home' | 'signup' | 'login' | 'about';

const router = useRouter();

const currentView = ref<PageView>('home');
const busy = ref(false);

const fullName = ref('');
const email = ref('');
const contactNumber = ref('');
const visitorType = ref('');
const barangay = ref('');
const homeCity = ref('');
const province = ref('');
const password = ref('');
const confirmPassword = ref('');

const message = ref('');
const messageType = ref<'error' | 'success'>('error');

function clearMessage() {
  message.value = '';
  messageType.value = 'error';
}

function goHome() {
  clearMessage();
  currentView.value = 'home';
}

function openSignup() {
  clearMessage();
  currentView.value = 'signup';
}

function openLogin() {
  clearMessage();
  currentView.value = 'login';
}

function openAbout() {
  clearMessage();
  currentView.value = 'about';
}

async function signUp() {
  if (busy.value) return;

  if (!isValidEmail(email.value)) {
    message.value = 'Please enter a valid email address.';
    messageType.value = 'error';
    return;
  }

  if (password.value.length < 6) {
    message.value = 'Password must be at least 6 characters long.';
    messageType.value = 'error';
    return;
  }

  if (password.value !== confirmPassword.value) {
    message.value = 'Passwords do not match.';
    messageType.value = 'error';
    return;
  }

  if (!visitorType.value) {
    message.value = 'Please select where you are from.';
    messageType.value = 'error';
    return;
  }

  if (
    visitorType.value === 'Naujan resident' &&
    !barangay.value.trim()
  ) {
    message.value = 'Please enter your barangay.';
    messageType.value = 'error';
    return;
  }

  if (
    visitorType.value === 'Outside Naujan' &&
    (!homeCity.value.trim() || !province.value.trim())
  ) {
    message.value =
      'Please enter your city or municipality and province.';
    messageType.value = 'error';
    return;
  }

  busy.value = true;
  clearMessage();

  try {
    const normalizedEmail = normalizeEmail(email.value);

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password.value,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName.value.trim(),
          contact_number: contactNumber.value.trim(),
          visitor_type: visitorType.value,
          barangay:
            visitorType.value === 'Naujan resident'
              ? barangay.value.trim()
              : null,
          home_city:
            visitorType.value === 'Outside Naujan'
              ? homeCity.value.trim()
              : null,
          province:
            visitorType.value === 'Outside Naujan'
              ? province.value.trim()
              : null,
        },
      },
    });

    if (error) throw error;

    if (data.session && data.user) {
      message.value = 'Account created successfully!';
      messageType.value = 'success';

      await router.replace(
        await destinationForUser(data.user.id)
      );
      return;
    }

    message.value =
      'Registration submitted! Please check your email to verify your account before logging in.';
    messageType.value = 'success';

    password.value = '';
    confirmPassword.value = '';
  } catch (err) {
    message.value = errorMessage(
      err,
      'Unable to create your account.'
    );
    messageType.value = 'error';
  } finally {
    busy.value = false;
  }
}

async function login() {
  if (busy.value) return;

  if (!isValidEmail(email.value) || !password.value) {
    message.value =
      'Enter a valid email address and your password.';
    messageType.value = 'error';
    return;
  }

  busy.value = true;
  clearMessage();

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
    const needsVerification =
      errorCode(err) === 'email_not_confirmed';

    message.value = needsVerification
      ? 'Please verify your email before logging in.'
      : errorMessage(err, 'Unable to log in.');

    messageType.value = 'error';
  } finally {
    busy.value = false;
  }
}

async function signInWithGoogle() {
  if (busy.value) return;

  busy.value = true;
  clearMessage();

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
    message.value = errorMessage(
      err,
      'Could not start Google login.'
    );
    messageType.value = 'error';
    busy.value = false;
  }
}
</script>

<style scoped>
/* MAIN PAGE */
.landing-content {
  --background: transparent;
  position: relative;
  font-family: Arial, Helvetica, sans-serif;
}

/* BACKGROUND IMAGE */
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(
      rgba(0, 0, 0, 0.20),
      rgba(0, 0, 0, 0.32)
    ),
    url('/images/background.jpg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

/* NAVIGATION */
.top-nav {
  position: absolute;
  top: 22px;
  right: 28px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-button {
  padding: 11px 22px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  color: #253b2d;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.nav-button:hover {
  background: #e9f2e8;
  transform: translateY(-1px);
}

/* HOME PAGE */
.home-screen {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  min-height: 100%;
  padding: 100px 24px 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
}

/* EXTRA LARGE LANDING LOGO */
.main-logo {
  display: block;
  width: clamp(405px, 130vw, 705px);
  height: clamp(405px, 130vw, 705px);
  max-width: 150vw;
  object-fit: contain;
  object-position: center;
  margin: 0 auto 15px;
  filter: drop-shadow(
    0 4px 12px rgba(0, 0, 0, 0.22)
  );
}

.home-screen h1 {
  margin: 0;
  font-size: clamp(38px, 6vw, 68px);
  font-weight: 800;
  letter-spacing: -1.5px;
  text-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
}

.tagline {
  max-width: 550px;
  margin: 16px 0 27px;
  font-size: clamp(15px, 2vw, 19px);
  line-height: 1.7;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.55);
}

/* BUTTONS */
.primary-button,
.google-button {
  box-sizing: border-box;
  width: 100%;
  min-height: 48px;
  padding: 13px 18px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.primary-button {
  background: #253b2d;
  color: #fff;
}

.primary-button:hover {
  background: #192b20;
}

.primary-button:disabled,
.google-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.home-button {
  width: auto;
  min-width: 170px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* CONTENT LAYOUT */
.page-content {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 90px 24px 40px;
}

/* WIDER FORM BOXES */
.auth-card,
.about-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.97);
  color: #26352a;
  box-shadow: 0 12px 38px rgba(0, 0, 0, 0.22);
}

.about-card {
  max-width: 700px;
}

/* BACK BUTTON */
.back-button {
  display: inline-block;
  margin-bottom: 15px;
  padding: 5px 0;
  border: none;
  background: transparent;
  color: #354d3a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

/* FORM LOGO */
.card-logo {
  display: block;
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin: 0 auto 12px;
}

/* HEADINGS */
.auth-card h2,
.about-card h2 {
  margin: 0;
  text-align: center;
  font-size: 28px;
  font-weight: 800;
}

.subtitle {
  margin: 9px 0 22px;
  color: #6b756d;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* FORM */
.auth-card form {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.auth-card label {
  display: block;
  margin: 12px 0 6px;
  color: #39473d;
  font-size: 13px;
  font-weight: 700;
}

/* UNIFORM INPUT AND DROPDOWN SIZES */
.auth-card input,
.auth-card select {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  min-height: 48px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid #d6ddd7;
  border-radius: 9px;
  outline: none;
  background: #fff;
  color: #26352a;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: normal;
}

.auth-card input::placeholder {
  color: #9aa39b;
  opacity: 1;
}

.auth-card input:focus,
.auth-card select:focus {
  border-color: #627c68;
  box-shadow: 0 0 0 3px rgba(98, 124, 104, 0.12);
}

/* SUBMIT BUTTON */
.full-button {
  margin-top: 18px;
}

/* OR SEPARATOR */
.separator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: #929b94;
  font-size: 11px;
}

.separator::before,
.separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e5e1;
}

/* GOOGLE BUTTON */
.google-button {
  border: 1px solid #d8ded9;
  background: #fff;
  color: #303b32;
}

.google-button:hover {
  background: #f4f7f4;
}

/* SIGNUP AND LOGIN LINKS */
.switch-text {
  margin: 20px 0 0;
  color: #707970;
  font-size: 13px;
  text-align: center;
}

.text-button {
  padding: 3px;
  border: none;
  background: transparent;
  color: #304e38;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

/* FEEDBACK MESSAGES */
.feedback {
  margin: 15px 0 0;
  padding: 11px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.feedback.error {
  background: #fff0ef;
  color: #a22b25;
}

.feedback.success {
  background: #edf8ef;
  color: #236735;
}

/* ABOUT US */
.about-card h3 {
  margin: 24px 0 8px;
  color: #304e38;
  font-size: 17px;
}

.about-card p,
.about-card li {
  color: #59645b;
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.about-card ul {
  padding-left: 22px;
}

.placeholder-note {
  font-style: italic;
  color: #7b837d !important;
}

/* MOBILE RESPONSIVE */
@media (max-width: 600px) {
  .top-nav {
    top: 14px;
    right: 14px;
    gap: 8px;
  }

  .nav-button {
    padding: 10px 15px;
    font-size: 12px;
  }

  .home-screen {
    padding: 85px 16px 35px;
  }
.main-logo {
  width: clamp(400px, 90vw, 750px);
  height: clamp(400px, 90vw, 750px);
  max-width: 95vw;
  object-fit: contain;
  margin: 0 auto;
}
  .page-content {
    padding: 78px 12px 24px;
  }

  .auth-card,
  .about-card {
    width: 100%;
    max-width: 100%;
    padding: 22px 18px;
    border-radius: 16px;
  }

  .card-logo {
    width: 85px;
    height: 85px;
  }

  .auth-card h2,
  .about-card h2 {
    font-size: 24px;
  }

  .auth-card input,
  .auth-card select {
    width: 100%;
    height: 48px;
    min-height: 48px;
    font-size: 14px;
  }
}

/* SHORT SCREENS */
@media (max-height: 750px) {
  .page-content {
    padding-top: 75px;
    padding-bottom: 24px;
  }

  .auth-card {
    padding-top: 20px;
    padding-bottom: 22px;
  }



  .subtitle {
    margin-bottom: 14px;
  }

  .auth-card label {
    margin-top: 9px;
  }

  .separator {
    margin: 14px 0;
  }

  .switch-text {
    margin-top: 14px;
  }
}

.back-button {
  font-size: 24px;
  padding: 8px 12px;
}

.card-logo {
  width: 390px;
  height: 90px;
  object-fit: contain;
}
</style>
