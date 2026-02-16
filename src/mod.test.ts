import { assertEquals } from "@std/assert";
import { Api, Context, type UserFromGetMe } from "./deps.deno.ts";
import {
    InlineKeyboard,
    InlineKeyboardWithJSON,
    jsonQuery,
    type JsonQueryFlavor,
} from "./mod.ts";

type TestContext = Context & JsonQueryFlavor;

/** Creates a Context for testing, casting through `any` to bypass strict Update types. */
// deno-lint-ignore no-explicit-any
function createCtx(update: any): TestContext {
    return new Context(
        update,
        new Api("test-token"),
        {} as UserFromGetMe,
    ) as TestContext;
}

// --- InlineKeyboard tests ---

Deno.test("InlineKeyboard.json() adds a JSON-encoded button", () => {
    const kb = new InlineKeyboard().json("Click", {
        action: "test",
        id: 1,
    });
    // deno-lint-ignore no-explicit-any
    const rows = (kb as any).inline_keyboard;
    assertEquals(rows.length, 1);
    assertEquals(rows[0].length, 1);
    assertEquals(rows[0][0].text, "Click");
    assertEquals(rows[0][0].callback_data, '{"action":"test","id":1}');
});

Deno.test(
    "InlineKeyboard.json() uses empty object by default",
    () => {
        const kb = new InlineKeyboard().json("Click");
        // deno-lint-ignore no-explicit-any
        const rows = (kb as any).inline_keyboard;
        assertEquals(rows[0][0].callback_data, "{}");
    },
);

Deno.test("InlineKeyboard.json() is chainable", () => {
    const kb = new InlineKeyboard()
        .json("A", { a: 1 })
        .json("B", { b: 2 });
    // deno-lint-ignore no-explicit-any
    const rows = (kb as any).inline_keyboard;
    assertEquals(rows[0].length, 2);
    assertEquals(rows[0][0].text, "A");
    assertEquals(rows[0][1].text, "B");
});

Deno.test("static InlineKeyboard.json() creates button", () => {
    const btn = InlineKeyboard.json("Static", { s: true });
    assertEquals(btn.text, "Static");
    assertEquals(btn.callback_data, '{"s":true}');
});

Deno.test("InlineKeyboardWithJSON is an alias for InlineKeyboard", () => {
    assertEquals(InlineKeyboardWithJSON, InlineKeyboard);
});

// --- jsonQuery middleware tests ---

Deno.test(
    "jsonQuery middleware parses callback query data as JSON",
    async () => {
        const mw = jsonQuery();

        const ctx = createCtx({
            update_id: 1,
            callback_query: {
                id: "1",
                from: { id: 1, is_bot: false, first_name: "Test" },
                chat_instance: "test",
                data: '{"action":"like","id":42}',
            },
        });

        let called = false;
        await mw.middleware()(ctx, () => {
            called = true;
            const data = ctx.jsonQuery as { action: string; id: number };
            assertEquals(data.action, "like");
            assertEquals(data.id, 42);
            return Promise.resolve();
        });
        assertEquals(called, true);
    },
);

Deno.test(
    "jsonQuery returns undefined for non-JSON data",
    async () => {
        const mw = jsonQuery();

        const ctx = createCtx({
            update_id: 1,
            callback_query: {
                id: "1",
                from: { id: 1, is_bot: false, first_name: "Test" },
                chat_instance: "test",
                data: "plain-text",
            },
        });

        await mw.middleware()(ctx, () => {
            assertEquals(ctx.jsonQuery, undefined);
            return Promise.resolve();
        });
    },
);

Deno.test(
    "jsonQuery returns undefined when no callback query",
    async () => {
        const mw = jsonQuery();

        const ctx = createCtx({
            update_id: 1,
            message: {
                message_id: 1,
                chat: { id: 1, type: "private" },
                date: 0,
                text: "hello",
            },
        });

        await mw.middleware()(ctx, () => {
            assertEquals(ctx.jsonQuery, undefined);
            return Promise.resolve();
        });
    },
);

Deno.test(
    "jsonQuery parses JSON arrays",
    async () => {
        const mw = jsonQuery();

        const ctx = createCtx({
            update_id: 1,
            callback_query: {
                id: "1",
                from: { id: 1, is_bot: false, first_name: "Test" },
                chat_instance: "test",
                data: "[1,2,3]",
            },
        });

        await mw.middleware()(ctx, () => {
            assertEquals(ctx.jsonQuery, [1, 2, 3]);
            return Promise.resolve();
        });
    },
);

Deno.test(
    "jsonQuery parses JSON primitives",
    async () => {
        const mw = jsonQuery();

        const ctx = createCtx({
            update_id: 1,
            callback_query: {
                id: "1",
                from: { id: 1, is_bot: false, first_name: "Test" },
                chat_instance: "test",
                data: "42",
            },
        });

        await mw.middleware()(ctx, () => {
            assertEquals(ctx.jsonQuery, 42);
            return Promise.resolve();
        });
    },
);
