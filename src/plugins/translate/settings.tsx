/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { OptionType } from "@utils/types";

import { openTranslateModal } from "./TranslateModal";

export const settings = definePluginSettings({
    receivedInput: {
        type: OptionType.STRING,
        description: "受信メッセージの翻訳元の言語",
        default: "auto",
        hidden: true
    },
    receivedOutput: {
        type: OptionType.STRING,
        description: "受信メッセージの翻訳先の言語",
        default: "en",
        hidden: true
    },
    sentInput: {
        type: OptionType.STRING,
        description: "自分のメッセージの翻訳元の言語",
        default: "auto",
        hidden: true
    },
    sentOutput: {
        type: OptionType.STRING,
        description: "自分のメッセージの翻訳先の言語",
        default: "en",
        hidden: true
    },
    service: {
        type: OptionType.SELECT,
        description: IS_WEB ? "Translation provider (not available on web)" : "Translation provider",
        hidden: IS_WEB,
        options: [
            { label: "Google翻訳", value: "google", default: true },
            { label: "DeepL Free - APIキーが必要", value: "deepl" },
            { label: "DeepL Pro - APIキーが必要", value: "deepl-pro" },
            { label: "Kagi Translate - APIキーが必要", value: "kagi" }
        ] as const,
        onChange: resetLanguageDefaults
    },
    deeplApiKey: {
        type: OptionType.STRING,
        displayName: "DeepL APIキー",
        description: "あなたの DeepL API キー（deepl.com/your-account から取得）",
        default: ""
    },
    kagiSession: {
        type: OptionType.STRING,
        description: "あなたの Kagi セッショントークン（kagi.com/settings?p=user_details から取得）",
        default: ""
    },
    autoTranslate: {
        type: OptionType.BOOLEAN,
        description: "送信前に自分のメッセージを自動で翻訳する。翻訳ボタンの Shift+クリックまたは右クリックでも切り替えられます",
        default: false
    },
    showAutoTranslateTooltip: {
        type: OptionType.BOOLEAN,
        description: "メッセージが自動翻訳されたときに、チャットバーのボタンにツールチップを表示する",
        default: true
    },
    manageTranslateSettings: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={openTranslateModal}>
                Customize translation languages & Auto-Translate
            </Button>
        )
    }
}, {
    deeplApiKey: {
        hidden() { return this.store.service !== "deepl" && this.store.service !== "deepl-pro"; }
    },
    kagiSession: {
        hidden() { return this.store.service !== "kagi"; }
    }
}).withPrivateSettings<{
    dismissedAutoTranslateAlert?: boolean;
}>();

export function resetLanguageDefaults() {
    if (IS_WEB || settings.store.service === "google" || settings.store.service === "kagi") {
        settings.store.receivedInput = "auto";
        settings.store.receivedOutput = "en";
        settings.store.sentInput = "auto";
        settings.store.sentOutput = "en";
    } else {
        settings.store.receivedInput = "";
        settings.store.receivedOutput = "en-us";
        settings.store.sentInput = "";
        settings.store.sentOutput = "en-us";
    }
}
