# 🎉 Kvizz Backend API & Socket: The Ultimate Frontend Survival Guide 🎉

Welcome, valiant frontend developer! 🦸‍♂️🦸‍♀️  
Need to tame the Kvizz backend? Here’s the **definitive** guide to all REST APIs and socket shenanigans.  
No route left unexplained, no socket left un-emitted.  
*Let’s make your app smarter than your coffee machine!*

---

## 📦 Base URL

```
https://<your-backend-domain>/api/v1/
```

---

# 🛠️ API Endpoints

Each endpoint below includes:
- **Route** (full path)
- **Method**
- **Headers** (what you need to send)
- **Body Example** (realistic payloads)
- **Authentication** (is login required?)
- **Description** (what it does, pro tips, quirks)

---

## 👤 Auth & User APIs

### `POST /users/signup`
- **Headers:** `Content-Type: application/json`
- **Body Example:**
  ```json
  {
    "name": "Jane Quizmaster",
    "email": "jane@example.com",
    "password": "SuperSecret123",
    "confirmPassword": "SuperSecret123"
  }
  ```
- **Auth:** No
- **Description:**  
  Registers a new user. Returns a JWT in a cookie and user info.  
  Pro tip: Passwords must match. Backend does not tolerate liars.

---

### `POST /users/login`
- **Headers:** `Content-Type: application/json`
- **Body Example:**
  ```json
  {
    "email": "jane@example.com",
    "password": "SuperSecret123"
  }
  ```
- **Auth:** No
- **Description:**  
  Logs in, returns JWT in a cookie and user info. Use this cookie for all protected endpoints!

---

### `GET /users/logout`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Logs out (destroys JWT cookie). Your user is now free-range.

---

### `POST /users/forgot-password`
- **Headers:** `Content-Type: application/json`
- **Body Example:**
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Auth:** No
- **Description:**  
  Triggers a password-reset email (if the backend is feeling helpful and SMTP is set).  
  You’ll get a reset token in your email.

---

### `PATCH /users/reset-password/:token`
- **Headers:** `Content-Type: application/json`
- **Body Example:**
  ```json
  {
    "password": "NewSecret123",
    "confirmPassword": "NewSecret123"
  }
  ```
- **Auth:** No
- **Description:**  
  Resets password using the provided token from email.  
  Token expires fast, like a Snap.

---

### `PATCH /users/update-password`
- **Headers:** `Cookie: jwt=<token>` `Content-Type: application/json`
- **Body Example:**
  ```json
  {
    "passwordCurrent": "OldSecret123",
    "password": "NewSuperSecret456",
    "confirmPassword": "NewSuperSecret456"
  }
  ```
- **Auth:** Yes
- **Description:**  
  Change your password (must provide current password).  
  Backend is strict: No current password, no dice.

---

### `GET /users/me`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Get your own profile data (id, name, email, etc).

---

### `PATCH /users/update-info`
- **Headers:** `Cookie: jwt=<token>`, `Content-Type: multipart/form-data`
- **Body Example:** (form fields)
  - `name`: "Quiz Queen"
  - `email` (optional): "queen@example.com"
  - `photo` (optional): *upload file*
- **Auth:** Yes
- **Description:**  
  Update your name, email, or profile photo.  
  Password changes? Use `/users/update-password`.

---

### `DELETE /users/delete-me`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Deactivate your account. You’re not deleted, just “sleeping”.

---

### `GET /users/`
- **Description:**  
  **Admins only**. Get all users.  
  Frontend mortals: you probably don’t need this.

---

### `POST /users/`
- **Description:**  
  Don’t use this. Use `/signup` for new users.

---

### `GET /users/:id`
- **Description:**  
  **Admins only**. Get user by ID.

---

### `PATCH /users/:id`
- **Description:**  
  **Admins only**. Update any user's data.

---

### `DELETE /users/:id`
- **Description:**  
  **Admins only**. Delete (deactivate) any user.

---

## 📝 Questions API

### `GET /questions/`
- **Description:**  
  Fetch ALL questions. Use filters/sorting in query params if you want to look smart.
- **Example:** `/questions/?sort=createdAt&limit=10`

---

### `POST /questions/`
- **Headers:** `Content-Type: application/json`, `Cookie: jwt=<token>`
- **Body Example:**
  ```json
  {
    "question": "What is the airspeed velocity of an unladen swallow?",
    "options": ["African", "European", "Both", "Coconut"],
    "answer": "European"
  }
  ```
- **Auth:** Yes
- **Description:**  
  Create new quiz questions.

---

### `GET /questions/:id`
- **Description:**  
  Get question by ID.

---

### `PATCH /questions/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Body Example:** (same as create)
- **Auth:** Yes
- **Description:**  
  Update a question.

---

### `DELETE /questions/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Delete a question.

---

## 🧠 Quizzes API

### `GET /quizzes/`
- **Description:**  
  Get all quizzes.

---

### `POST /quizzes/`
- **Headers:** `Content-Type: application/json`, `Cookie: jwt=<token>`
- **Body Example:**
  ```json
  {
    "title": "General Knowledge",
    "description": "A quiz for everyone",
    "public": true
  }
  ```
- **Auth:** Yes
- **Description:**  
  Create a quiz.

---

### `GET /quizzes/:id`
- **Description:**  
  Get quiz details by ID.

---

### `PATCH /quizzes/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Body Example:** (partial update allowed)
  ```json
  {
    "title": "Ultimate GK Quiz"
  }
  ```
- **Auth:** Yes
- **Description:**  
  Update quiz info.

---

### `DELETE /quizzes/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Delete a quiz.

---

### `GET /quizzes/of/:userId`
- **Description:**  
  Get all quizzes created by a user.

---

### `GET /quizzes/:id/questions`
- **Description:**  
  Get all questions for a quiz (not in a live game).

---

### `POST /quizzes/do/save`
- **Headers:** `Content-Type: application/json`, `Cookie: jwt=<token>`
- **Body Example:**
  ```json
  {
    "quiz": { ...quizFields },
    "questions": [{ ...q1 }, { ...q2 }]
  }
  ```
- **Auth:** Yes
- **Description:**  
  Create quiz and questions together.

---

### `PATCH /quizzes/do/update`
- **Headers:** `Content-Type: application/json`, `Cookie: jwt=<token>`
- **Body Example:** (like save)
- **Auth:** Yes
- **Description:**  
  Update quiz and its questions.

---

### `DELETE /quizzes/do/delete/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Delete quiz and all its questions.

---

### AI & File Quiz Generation

- **`POST /quizzes/generate/prompt`**  
  - **Body:** `{ "prompt": "Make a quiz about cats" }`
  - **Description:** Generate quiz using AI magic.

- **`POST /quizzes/generate/csv`**  
  - **Headers:** `Content-Type: multipart/form-data`
  - **Body:** field `file`: (CSV file)
  - **Description:** Generate quiz from uploaded CSV.

- **`POST /quizzes/generate/pdf`**  
  - **Headers:** `Content-Type: multipart/form-data`
  - **Body:** field `file`: (PDF file)
  - **Description:** Generate quiz from uploaded PDF.

---

## 🎮 Game Sessions API

### `GET /games/explore`
- **Description:**  
  List all public games/quizzes for joining.

---

### `GET /games/`
- **Description:**  
  Get all game sessions.

---

### `POST /games/`
- **Headers:** `Content-Type: application/json`, `Cookie: jwt=<token>`
- **Body Example:**
  ```json
  {
    "quizId": "64abc123",
    "hostId": "user777"
  }
  ```
- **Auth:** Yes
- **Description:**  
  Create a new game session.

---

### `GET /games/:id`
- **Description:**  
  Get a game session by ID.

---

### `PATCH /games/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Body Example:** (update fields)
- **Auth:** Yes
- **Description:**  
  Update a game session.

---

### `DELETE /games/:id`
- **Headers:** `Cookie: jwt=<token>`
- **Auth:** Yes
- **Description:**  
  Delete a game session.

---

# 🔌 Socket.IO: Real-Time Quiz Madness

## 🎢 Connection
```js
import { io } from "socket.io-client";
const socket = io('https://<your-backend-domain>');
```

---

## 🏓 Core Events

### 1. **Create Room**
- **Emit:** `"create-room"`
  ```js
  socket.emit("create-room", {
    quizId: "64abc123",
    hostId: "user777"
  });
  ```
- **Listen:** `"game-created"`
  ```js
  socket.on("game-created", (session) => {
    // session = { ...full game session info }
  });
  ```
- **Errors:** `"error"` (if missing quizId/hostId)

---

### 2. **Join Room**
- **Emit:** `"join-room"`
  ```js
  socket.emit("join-room", {
    gameCode: "ABCDEF",
    userId: "user888",          // Optional if username is given
    username: "QuizFan"         // Required if userId not available
  });
  ```
- **Listen:** `"participant-joined"`
  ```js
  socket.on("participant-joined", (session) => {
    // session = updated gameSession for all participants
  });
  ```
- **Errors:** `"error"` (if game not found, username in use, etc.)

---

### 3. **Leave Room**
- **Emit:** `"leave-quiz"`
  ```js
  socket.emit("leave-quiz", {
    gameSessionId: "game123",
    userId: "user888",      // or just username if that's what you joined with
    username: "QuizFan"
  });
  ```
- **Listen:** `"participant-left"`

---

### 4. **Start Quiz**
- **Emit:** `"start-quiz"`
  ```js
  socket.emit("start-quiz", {
    gameSessionId: "game123"
  });
  ```
- **Listen:** `"game-started"`

---

### 5. **Stop Quiz**
- **Emit:** `"stop-quiz"`
  ```js
  socket.emit("stop-quiz", {
    gameSessionId: "game123"
  });
  ```
- **Listen:** `"final-leaderboard"`

---

### 6. **Get Questions (Live)**
- **Emit:** `"get-questions"`
  ```js
  socket.emit("get-questions", {
    gameSessionId: "game123"
  });
  ```
- **Listen:** `"load-questions"`
  ```js
  socket.on("load-questions", (quiz) => {
    // quiz = { ...full quiz object with questions }
  });
  ```

---

### 7. **Submit Answer**
- **Emit:** `"submit-answer"`
  ```js
  socket.emit("submit-answer", {
    gameSessionId: "game123",
    username: "QuizFan",
    questionId: "q12345",
    answers: ["A"],         // or for multiple choice: ["A", "C"]
    isCorrect: true,
    timeTaken: 12000        // ms (optional, for leaderboard)
  });
  ```
- **Listen:** `"live-scores-updated"`
  ```js
  socket.on("live-scores-updated", (session) => {
    // session = updated gameSession with scoreboard
  });
  ```

---

### 8. **Listen for Other Events**

```js
socket.on("participant-left", (session) => { ... });
socket.on("participant-kicked", (session) => { ... });
socket.on("participants-updated", (session) => { ... });
socket.on("participant-disconnected", (session) => { ... });
socket.on("final-leaderboard", (session) => { ... });
socket.on("error", (msg) => { alert(msg); });
```

---

## 📝 Socket Event Summary Table

| Event (emit)      | Payload Example | Listen for      | Data Received                 | Notes |
|-------------------|----------------|-----------------|-------------------------------|-------|
| create-room       | `{ quizId, hostId }` | game-created    | `gameSession`                 | Host only |
| join-room         | `{ gameCode, userId?, username? }` | participant-joined | `gameSession` | All in room |
| leave-quiz        | `{ gameSessionId, userId?, username? }` | participant-left | `gameSession` | All in room |
| start-quiz        | `{ gameSessionId }` | game-started    | `gameSession`                 | All in room |
| stop-quiz         | `{ gameSessionId }` | final-leaderboard | `gameSession`               | All in room |
| get-questions     | `{ gameSessionId }` | load-questions  | `quiz`                        | Requester's socket |
| submit-answer     | `{ gameSessionId, username, questionId, answers, isCorrect, timeTaken }` | live-scores-updated | `gameSession` | All in room |

---

# ⚠️ Error Handling

- **API:** Non-200 HTTP? The body will be `{ status: "error", message: "..." }`.  
- **Socket:** Always listen for `"error"` and show helpful messages to your user.

---

# 👑 Go Build That Quiz UI!
If something blows up, blame the backend devs.  
If it works, tell your friends you did it all yourself. 😉

*Made with ❤️, Node.js, and a deep love for trivia.*
