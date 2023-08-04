import { PassThrough, Readable } from "stream";
import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import { generate, transcribe } from "polyfact";

const pandoc = require("node-pandoc");
 
async function mdToHTML(md: string): Promise<string> {
    return new Promise((res, rej) => pandoc(md, '-f markdown -t html -s', (err: Error, result: string) => { if (err) { rej(err) } else { res(result) } }));
}

async function generateMDFromAudio(audioFile: Readable): Promise<{ title: string, md: string }> {
    const transcription = await transcribe(audioFile);
    let article = await generate(`Here's a transcription of me talking:\n\`\`\`\n${transcription}\n\`\`\`\n From this write a blog article in markdown. Don't use images. Structure you articles in sections. Each section must have a title in markdown. Don't add any note. Don't comment anything. Just send the article in markdown.`);

    article = article.trim();

    let title = article.split('\n')[0];

    if (title.startsWith("# ")) {
        title = title.slice(2).replace(":", "");
        article = `---\ntitle: ${title}\ndescription: ${title}\n---\n` + article.split('\n').slice(1).join("\n");
    } else {
        title = "Article";
        article = `---\ntitle: Article\ndescription: Article\n---\n` + article;
    }

    return { title, md: article };
}

function slugify(s: string): string {
    const slug = s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-");

    if (!slug) {
        return "_";
    }

    return slug;
}

(async () => {
    const token = process.env.TELEGRAM_TOKEN || "";

    const bot = new TelegramBot(token, {polling: true});

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      try {
        const message = msg.text || "";

        if (message === "/start") {
            bot.sendMessage(chatId, "Hey 👋\nI'm Voice2Article bot 🤖\nYou can send me a voice recording of you talking 🎤 and I'll generate a blog article out of it 📖")
            return;
        }

        if (msg.voice) {
            const { file_id } = msg.voice;

            bot.sendMessage(chatId, "Got it. I will generate an article based on the audio you sent 🫡\nYou can expect it to take up to a few minutes ⏳")
            
            const response = await fetch(await bot.getFileLink(file_id));

            if (!response.ok || !response.body) throw new Error(`unexpected response ${response.statusText}`);

            const stream = new PassThrough()
            response.body.pipe(stream);
            const { title, md: transcription } = await generateMDFromAudio(stream);

            const slug = slugify(title) 

            bot.sendMessage(chatId, `Done 🔥\nHere's your article !\nI named it **${title}**\nNext is the markdown version along with a preview you can open in a browser.`, { parse_mode: "Markdown" });
            bot.sendDocument(chatId, Buffer.from(transcription, "utf8"), {}, { filename: `${slug}.md`, contentType: "text/markdown" });
            bot.sendDocument(chatId, Buffer.from(await mdToHTML(transcription), "utf8"), {}, { filename: `preview.html`, contentType: "text/html" });
        }
      } catch (err) {
          console.error(err);
          bot.sendMessage(chatId, "Oops, something wrong happened 😵‍💫");
      }
    });

    console.log("Telegram bot started 🚀");
})()
