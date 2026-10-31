/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType } from "@api/Commands";
import { showNotification } from "@api/Notifications";
import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings } from "@api/Settings";
import equicordToolbox from "@equicordplugins/equicordToolbox";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { saveFile } from "@utils/web";
import { Menu, UserSettingsActionCreators } from "@webpack/common";

async function saveContentToFile(content: string, filename: string) {
    try {
        if (IS_DISCORD_DESKTOP) {
            const data = new TextEncoder().encode(content);
            await DiscordNative.fileManager.saveWithDialog(data, filename);
        } else {
            const file = new File([content], filename, { type: "text/plain" });
            saveFile(file);
        }

        showNotification({
            title: "Save Favorite GIFs",
            body: `GIF を ${filename} として保存しました`,
            color: "var(--text-positive)",
        });
    } catch (error) {
        console.error(error);
        showNotification({
            title: "Save Favorite GIFs",
            body: "GIF の保存に失敗しました",
            color: "var(--text-danger)",
        });
    }
}

function getGifUrls(): string[] {
    return Object.keys(UserSettingsActionCreators.FrecencyUserSettingsActionCreators.getCurrentValue().favoriteGifs.gifs);
}

async function saveAllGifs() {
    const filename = `favorite-gifs-${new Date().toISOString().split("T")[0]}.txt`;
    const gifUrls = getGifUrls();

    if (gifUrls.length === 0) {
        showNotification({ title: "Save Favorite GIFs", body: "お気に入りの GIF が見つかりませんでした" });
        return;
    }

    const content = gifUrls.join("\n");
    await saveContentToFile(content, filename);
}

async function saveWorkingGifs() {
    const gifUrls = getGifUrls();

    if (gifUrls.length === 0) {
        showNotification({ title: "Save Favorite GIFs", body: "お気に入りの GIF が見つかりませんでした" });
        return;
    }

    showNotification({
        title: "Save Favorite GIFs",
        body: `${gifUrls.length} 件の GIF をテスト中です.. しばらくお待ちください...`,
    });

    const workingUrls: string[] = [];

    await Promise.all(gifUrls.map(async url => {
        try {
            const response = await fetch(url, { method: "HEAD" });
            if (response.ok) workingUrls.push(url);
        } catch (e) {
            try {
                const response = await fetch(url);
                if (response.ok) workingUrls.push(url);
            } catch (err) { }
        }
    }));

    if (workingUrls.length === 0) {
        showNotification({ title: "Save Favorite GIFs", body: "保存した GIF はすべて使えないようです" });
        return;
    }

    const filename = `working-gifs-${new Date().toISOString().split("T")[0]}.txt`;
    const content = workingUrls.join("\n");

    await saveContentToFile(content, filename);

    showNotification({
        title: "Save Favorite GIFs",
        body: `壊れている可能性のある GIF を ${gifUrls.length - workingUrls.length} 件除外しました。使える GIF を ${workingUrls.length} 件保存しました。`,
        color: "var(--text-positive)",
    });
}

const settings = definePluginSettings({
    showToolboxButton: {
        description: "Equicord Toolbox に「Save Favorite GIFs」ボタンを表示（再読み込みが必要）",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: true,
        get hidden() {
            return !isPluginEnabled(equicordToolbox.name);
        }
    }
});

export default definePlugin({
    name: "SaveFavoriteGIFs",
    description: "お気に入り登録した GIF の URL をエクスポートします",
    dependencies: ["CommandsAPI"],
    tags: ["Emotes", "Utility"],
    authors: [Devs.thororen],
    settings,
    commands: [
        {
            name: "savegifs",
            description: "お気に入り GIF の URL をすべてテキストファイルに保存します",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: saveAllGifs
        },
        {
            name: "saveworkinggifs",
            description: "お気に入り GIF をすべてテストし、まだ使えるものだけを保存します",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: saveWorkingGifs
        }
    ],
    toolboxActions() {
        const { showToolboxButton } = settings.use(["showToolboxButton"]);
        if (!showToolboxButton) return null;

        return (
            <Menu.MenuItem
                id="save-favorite-gifs-toolbox"
                label="Save Favorite GIFs"
                action={saveAllGifs}
            />
        );
    }
});
