# Voice ➡️ Article
A telegram bot that transform audio recording of you rambling about a random subject into complete blog articles.

## 🔥 Try it
You can just send audio recordings of you speaking about a subject that interest you to to [@Voice2ArticleBot](https://t.me/voice2articlebot)

## 🚀 How to install your own bot

First, clone the project and install the dependencies with

```bash
git clone https://github.com/lowczarc/voice2article.git
cd voice2article
yarn
```

You will need a `TELEGRAM_TOKEN` and a `POLYFACT_TOKEN`.

### 🤖 Getting A Telegram bot Token
The TELEGRAM TOKEN can be retrieved by creating a bot with [@BotFather](https://t.me/BotFather)

You then need to export the token in your environment:
```bash
export TELEGRAM_TOKEN=<your_telegram_bot_token>
```

### 🏭 Getting Your PolyFact Token

Voice2Article uses PolyFact to generate AI responses. PolyFact is a managed backend, it abstract from the client all the hassle of managing different APIs, models, databases, etc...

Follow these steps to get your PolyFact token:

1. Go to [app.polyfact.com](https://app.polyfact.com).
2. Connect with GitHub.
3. Copy the token.

Then, you need to export the PolyFact token in your environment:

```bash
export  POLYFACT_TOKEN=<your_polyfact_token>
```

### ⭐ Start your bot

You can now start the bot with:
```bash
yarn start
```
