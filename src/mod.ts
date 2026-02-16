import { BaseInlineKeyboard, Composer, Context } from "./deps.deno.ts";
import type { InlineKeyboardButton } from "./deps.deno.ts";

/**
 * Flavor for context that adds the `jsonQuery` getter.
 */
export type JsonQueryFlavor = {
    /**
     * Parsed JSON from callback query data (`ctx.callbackQuery.data`).
     * Returns `undefined` if the data is not valid JSON.
     */
    readonly jsonQuery: unknown | undefined;
};

type JsonQueryContext = Context & JsonQueryFlavor;

/**
 * Extended `InlineKeyboard` that adds a convenient `.json()` method
 * for creating buttons whose callback data is a JSON-encoded string.
 *
 * @example
 * ```typescript
 * const keyboard = new InlineKeyboard()
 *     .json("Like", { action: "like", id: 42 })
 *     .json("Dislike", { action: "dislike", id: 42 });
 * ```
 */
export class InlineKeyboard extends BaseInlineKeyboard {
    /**
     * Creates a new JSON-encoded callback button object.
     *
     * @param text Button label
     * @param data Data to be JSON-encoded as callback data
     */
    static json(
        text: string,
        data: unknown = {},
    ): InlineKeyboardButton.CallbackButton {
        const encoded = JSON.stringify(data);
        if (typeof encoded !== "string") {
            throw new Error(
                "Callback data could not be serialized to JSON",
            );
        }
        const byteLength = new TextEncoder().encode(encoded).byteLength;
        if (byteLength > 64) {
            throw new Error(
                `Callback data exceeds 64 bytes: ${byteLength} (${encoded})`,
            );
        }
        return BaseInlineKeyboard.text(text, encoded);
    }

    /**
     * Adds a JSON-encoded callback button to the current row.
     *
     * @param text Button label
     * @param data Data to be JSON-encoded as callback data
     */
    json(text: string, data: unknown = {}) {
        return this.add(InlineKeyboard.json(text, data));
    }
}

/**
 * Backward-compatible alias for `InlineKeyboard`.
 * @deprecated Use `InlineKeyboard` instead.
 */
export const InlineKeyboardWithJSON = InlineKeyboard;

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
 *     InlineKeyboard,
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
        Object.defineProperty(ctx, "jsonQuery", {
            get() {
                const data = ctx.callbackQuery?.data;
                if (typeof data !== "string") return undefined;
                try {
                    return JSON.parse(data);
                } catch {
                    return undefined;
                }
            },
            configurable: true,
            enumerable: true,
        });
        return next();
    });

    return composer;
}

export default jsonQuery;
