/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { OptionType } from "@utils/types";
import { useStateFromStores } from "@webpack/common";

import { addIndicator, removeIndicator } from ".";
import { HiddenServersMenu } from "./components/HiddenServersMenu";
import { HiddenServersStore } from "./HiddenServersStore";

export default definePluginSettings({
    showIndicator: {
        type: OptionType.BOOLEAN,
        description: "リストの下部にサーバーの再表示メニューを表示します",
        default: true,
        onChange: val => {
            if (val) {
                addIndicator();
            } else {
                removeIndicator();
            }
        }
    },
    guildsList: {
        type: OptionType.COMPONENT,
        description: "非表示のサーバーを削除します",
        component: () => {
            const detail = useStateFromStores([HiddenServersStore], () => HiddenServersStore.hiddenGuildsDetail());
            return <HiddenServersMenu guilds={detail} />;
        }
    },
    resetHidden: {
        type: OptionType.COMPONENT,
        description: "非表示のギルドをすべてリストから削除します",
        component: () => (
            <div>
                <Button
                    size="small"
                    variant="dangerPrimary"
                    onClick={() => HiddenServersStore.clearHidden()}
                >
                    Reset Hidden Servers
                </Button>
            </div>
        ),
    },
});
