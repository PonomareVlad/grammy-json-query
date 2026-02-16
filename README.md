# JSON Callback Query Plugin for grammY

A [grammY](https://grammy.dev/) plugin that extends `InlineKeyboard` with a
convenient `.json()` method for creating buttons with JSON-encoded callback
data, and provides middleware to automatically parse callback query data as JSON.

## Features

- **InlineKeyboardWithJSON** — extends grammY's `InlineKeyboard` with a `.json()` method
  that encodes callback data as JSON.
- **jsonQuery middleware** — hydrates `ctx.jsonQuery` with the parsed JSON from
  callback query data.
- **JsonQueryFlavor** — TypeScript context flavor for type-safe access to `ctx.jsonQuery`.

## Installation

### Node.js

```bash
npm install grammy-json-query
```

### Deno

```typescript
import {
    InlineKeyboardWithJSON,
    jsonQuery,
    type JsonQueryFlavor,
} from "npm:grammy-json-query";
```

## Usage

```typescript
import { Bot, Context } from "grammy";
import {
    InlineKeyboardWithJSON,
    jsonQuery,
    type JsonQueryFlavor,
} from "grammy-json-query";

type MyContext = Context & JsonQueryFlavor;

const bot = new Bot<MyContext>("<your-bot-token>");

// Install the JSON query middleware
bot.use(jsonQuery());

// Send an inline keyboard with JSON-encoded buttons
bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboardWithJSON()
        .json("Like 👍", { action: "vote", value: "like" })
        .json("Dislike 👎", { action: "vote", value: "dislike" });

    await ctx.reply("Rate this bot:", { reply_markup: keyboard });
});

// Handle callback queries with parsed JSON data
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.jsonQuery as { action: string; value: string };

    if (data?.action === "vote") {
        await ctx.answerCallbackQuery({
            text: `You voted: ${data.value}`,
        });
    }
});

bot.start();
```

### Static Method

You can also use the static `.json()` method to create a button in one step:

```typescript
const keyboard = InlineKeyboardWithJSON.json("Click me", { id: 42 });
```
