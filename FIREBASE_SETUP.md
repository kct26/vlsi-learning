# Turn on Google sign-in (about 10 minutes, once)

Without this, the trainer saves progress in each browser separately. With it, a **Sign in** button appears, and progress follows you to every device where you sign in. Firebase's free plan is more than enough.

## 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project** (or **Add project**). Name it, for example `vlsi-learning`. You can turn Google Analytics off. Click **Create project**.

## 2. Register the website and copy its config
1. On the project's home page, click the **web** icon (`</>`) under "Get started by adding Firebase to your app".
2. Give it a nickname (for example `trainer`). **Don't** tick Firebase Hosting. Click **Register app**.
3. Firebase shows a code block containing `const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., ... }`. Copy just the `{ ... }` part.
4. Open `docs/firebase-config.js` in this repository and replace `null` with it, so the line reads:
   ```js
   window.FIREBASE_CONFIG = { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." };
   ```
   This config is designed to be public. It identifies the project; it does not grant access. Access is controlled by the rules in step 4.

## 3. Turn on Google sign-in
1. In the left menu, open **Build → Authentication** and click **Get started**.
2. Under **Sign-in method**, choose **Google**, switch it to **Enable**, pick your support email, and click **Save**.
3. Open the **Settings** tab, then **Authorized domains**, click **Add domain**, and add `kct26.github.io` (your GitHub Pages address). `localhost` is already there for testing.

## 4. Create the database and lock it down
1. Open **Build → Firestore Database** and click **Create database**.
2. Choose a location near you (for example `nam5 (United States)`), then **Start in production mode**, then **Create**.
3. Open the **Rules** tab, replace everything with the contents of `firestore.rules` from this repository, and click **Publish**. Now each person can read and write only their own progress.

## 5. Publish
Commit and push the changed `docs/firebase-config.js`:
```bash
git add docs/firebase-config.js
git commit -m "Turn on Google sign-in"
git push
```
Open the site, click **Sign in** in the top bar, and choose your Google account. Whatever progress that browser already had is merged into your account. Do the same on your other devices.

Sign-in uses a popup window, so allow popups for the site if your browser blocks it. It works on the GitHub Pages address. When you open `index.html` straight from your computer (`file://`), Google sign-in is not allowed, so use **Export progress** and **Import progress** on the Weekly page there instead.
