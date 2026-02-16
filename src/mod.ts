import { Composer, Context, InlineKeyboard } from "./deps.deno.ts";

/**
 * Flavor for context that adds the `jsonQuery` getter.
 */
export type JsonQueryFlavor = {
    /**
     * Parsed JSON from callback query data (`ctx.callbackQuery.data`).
     * Returns `undefined` if the data is not valid JSON.
     */
    jsonQuery: unknown | undefined;
};

type JsonQueryContext = Context & JsonQueryFlavor;

/**
 * Extended `InlineKeyboard` that adds a convenient `.json()` method
 * for creating buttons whose callback data is a JSON-encoded string.
 *
 * @example
 * ```typescript
 * const keyboard = new InlineKeyboardWithJSON()
 *     .json("Like", { action: "like", id: 42 })
 *     .json("Dislike", { action: "dislike", id: 42 });
 * ```
 */
export class InlineKeyboardWithJSON extends InlineKeyboard {
    /**
     * Creates a new `InlineKeyboardWithJSON` with a single JSON button.
     *
     * @param text Button label
     * @param data Data to be JSON-encoded as callback data
     */
    static json(text: string, data: unknown = {}) {
        return new InlineKeyboardWithJSON().json(text, data);
    }

    /**
     * Adds a JSON-encoded callback button to the current row.
     *
     * @param text Button label
     * @param data Data to be JSON-encoded as callback data
     */
    json(text: string, data: unknown = {}) {
        return this.text(text, JSON.stringify(data));
    }
}

/**
 * Creates middleware that parses callback query data as JSON and
 * exposes the result via `ctx.jsonQuery`.
 *
 * Install it on your bot to automatically parse callback query data
 * as JSON.
 *
 * @returns A composer with the JSON query middleware installed
 *
 * @example
 * ```typescript
 * import { Bot, Context } from "grammy";
 * import {
 *     InlineKeyboardWithJSON,
 *     jsonQuery,
 *     type JsonQueryFlavor,
 * } from "grammy-json-query";
 *
 * type MyContext = Context & JsonQueryFlavor;
 *
 * const bot = new Bot<MyContext>("<token>");
 *
 * bot.use(jsonQuery());
 *
 * bot.on("callback_query:data", async (ctx) => {
 *     const data = ctx.jsonQuery;
 *     console.log(data); // parsed JSON object
 *     await ctx.answerCallbackQuery();
 * });
 * ```
 */
export function jsonQuery(): Composer<JsonQueryContext> {
    const composer = new Composer<JsonQueryContext>();

    composer.use((ctx, next) => {
        let cached: { value: unknown } | undefined;
        Object.defineProperty(ctx, "jsonQuery", {
            get() {
                if (cached) return cached.value;
                const data = ctx.callbackQuery?.data;
                if (typeof data !== "string") return undefined;
                try {
                    cached = { value: JSON.parse(data) };
                } catch {
                    cached = { value: undefined };
                }
                return cached.value;
            },
            configurable: true,
            enumerable: true,
        });
        return next();
    });

    return composer;
}

export default jsonQuery;
