import { PassThrough, Readable } from "stream";
import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import { readFileSync } from "fs";
import {gzip} from "node-gzip";
import { generate, transcribe, Chat, Memory, kv } from "polyfact";

const pandoc = require("node-pandoc");
 
async function mdToHTML(md: string): Promise<string> {
    return new Promise((res, rej) => pandoc(md, '-f markdown -t html -s', (err: Error, result: string) => { if (err) { rej(err) } else { res(result) } }));
}

async function generateMDFromAudio(audioFile: Readable): Promise<string> {
    const transcription = await transcribe(audioFile);
    const article = await generate(`Here's a transcription of me talking:\n\`\`\`\n${transcription}\n\`\`\`\n From this write a blog article in markdown. Don't use images. Structure you articles in sections. Each section must have a title in markdown. Don't add any note. Don't comment anything. Just send the article in markdown. Start with markdown metadata with the title and description field. Don't include an h1, start with h2. Be sure to not use colons in the metadatas as it would be invalid yaml.`);

    // const article = readFileSync("./article.txt", "utf8");

    return article;
}

(async () => {
    const token = process.env.TELEGRAM_TOKEN || "";

    const bot = new TelegramBot(token, {polling: true});

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      try {
        const message = msg.text || "";

        if (message === "/start") {
            bot.sendMessage(chatId, "Hey 👋\nI'm Voice2Article bot ! You can send me a voice recording of you talking and I'll generate a blog article out of it !")
            return;
        }

        if (msg.voice) {
            const { file_id } = msg.voice;

            bot.sendMessage(chatId, "Got it. I will generate an article based on the audio you sent 🫡\nYou can expect it to take up to a few minutes ⏳")
            
            const response = await fetch(await bot.getFileLink(file_id));

            if (!response.ok || !response.body) throw new Error(`unexpected response ${response.statusText}`);

            const stream = new PassThrough()
            response.body.pipe(stream);
            const transcription = await generateMDFromAudio(stream);

            bot.sendMessage(chatId, "Done 🔥\nHere's your article in markdown along with a preview you can open in a browser.\nIf you want to modify it, just send me a message to explain what to modify. I'll take care of it.");
            bot.sendDocument(chatId, Buffer.from(transcription, "utf8"), {}, { filename: "article.md", contentType: "text/markdown" });
            bot.sendDocument(chatId, Buffer.from(await mdToHTML(transcription), "utf8"), {}, { filename: "preview.html", contentType: "text/html" });
        }
      } catch (err) {
          console.error(err);
          bot.sendMessage(chatId, "Oops, something wrong happened 😵‍💫");
      }
    });
})()
