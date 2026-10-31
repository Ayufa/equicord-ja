/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Notice } from "@components/Notice";
import { useCspPermission } from "@utils/csp";
import { OptionType } from "@utils/types";

function EndpointNotice() {
    const { endpoint } = settings.use(["endpoint"]);
    const [isAllowed, allow] = useCspPermission(endpoint, ["connect-src"], "TriviaAI");
    if (isAllowed) return null;

    return (
        <Notice variant="warning" action={<Button size="small" variant="secondary" onClick={allow}>Allow Host</Button>}>
            Connections to {URL.parse(endpoint)?.host} are blocked. Allow this host if you trust it, then restart Discord.
        </Notice>
    );
}

export const settings = definePluginSettings({
    apiKey: {
        type: OptionType.STRING,
        description: "APIキー。",
        default: "",
        placeholder: "AIエンドポイントのAPIキーをここに入力してください。",
        componentProps: {
            type: "password"
        }
    },
    model: {
        type: OptionType.STRING,
        description: "使用するAIモデル。",
        default: "google/gemini-3-flash-preview",
        placeholder: "例: google/gemini-3-flash-preview、inception/mercury、openai/gpt-5.2-chat など"
    },
    systemPrompt: {
        type: OptionType.STRING,
        description: "AIのシステムプロンプト。プレースホルダ: {current_user}、{current_time}",
        default: "You are a helpful assistant who answers questions for the user in a concise and short way while using the least amount of words and punctuation.\nCurrent user: {current_user}\nCurrent time: {current_time}",
        placeholder: "システムプロンプトを入力してください。",
        multiline: true
    },
    maxTokens: {
        type: OptionType.NUMBER,
        description: "応答の最大トークン数。",
        default: 500
    },
    endpoint: {
        type: OptionType.STRING,
        description: "OpenAI互換のAIエンドポイント。",
        default: "https://openrouter.ai/api/v1/chat/completions",
        placeholder: "OpenAI互換のAIエンドポイントをここに入力してください。"
    },
    endpointPermission: {
        type: OptionType.COMPONENT,
        component: () => <EndpointNotice />
    },
    context: {
        type: OptionType.NUMBER,
        description: "コンテキストに含める過去のメッセージ数。",
        default: 0
    },
    passMessageAuthorName: {
        type: OptionType.BOOLEAN,
        description: "AIに渡すとき、メッセージ内容の前に送信者名を付けます。会話内のユーザーをAIが区別しやすくなります。",
        default: true
    },
    treatSelfAsAssistant: {
        type: OptionType.BOOLEAN,
        description: "有効にすると、自分のメッセージがコンテキスト内でアシスタントのメッセージとして扱われます。一部のモデルが二次創作を生成し始めることがあります。",
        default: false
    },
    mode: {
        type: OptionType.SELECT,
        description: "回答の扱い方",
        options: [
            { label: "自動返信", value: "autoreply" },
            { label: "チャットバーのテキストを置き換え", value: "chatbar", default: true },
            { label: "Clyde", value: "bot" }
        ]
    },
    supportImages: {
        type: OptionType.BOOLEAN,
        description: "画像がある場合、コンテキストとしてAIに渡します。すべてのモデルが対応しているわけではありません。",
        default: true
    },
    sendImagesAsBase64: {
        type: OptionType.BOOLEAN,
        description: "画像をBase64としてAIに送信します。",
        default: false
    }
});
