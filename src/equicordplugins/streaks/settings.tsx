/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { OptionType } from "@utils/types";
import { UserStore } from "@webpack/common";

import { useAuthorizationStore } from "./stores/AuthorizationStore";
import { useStreaksStore } from "./stores/StreaksStore";

export const settings = definePluginSettings({
    account: {
        type: OptionType.COMPONENT,
        description: "Streaks APIにログイン/ログアウトします。",
        component() {
            const { isAuthorized, authorize, remove } = useAuthorizationStore();

            if (isAuthorized()) {
                return (
                    <Flex>
                        <Button
                            onClick={() => remove(UserStore.getCurrentUser()?.id)}
                            variant="dangerPrimary"
                        >
                            Log Out of Streaks API
                        </Button>
                    </Flex>
                );
            } else {
                return (
                    <Flex>
                        <Button onClick={async () => {
                            await authorize();
                            await useStreaksStore.getState().migrate();
                            await useStreaksStore.getState().fetch();
                        }}>
                            Log In to Streaks API
                        </Button>
                    </Flex>
                );
            }
        }
    },
    eliteColor: {
        type: OptionType.STRING,
        description: "エリートストリークの色（100日以上）",
        default: "#9b39fe"
    },
    diamondColor: {
        type: OptionType.STRING,
        description: "ダイヤモンドストリークの色（60日以上）",
        default: "#f7409c"
    },
    platinumColor: {
        type: OptionType.STRING,
        description: "プラチナストリークの色（45日以上）",
        default: "#856bfe"
    },
    goldColor: {
        type: OptionType.STRING,
        description: "ゴールドストリークの色（30日以上）",
        default: "#f75340"
    },
    silverColor: {
        type: OptionType.STRING,
        description: "シルバーストリークの色（14日以上）",
        default: "#f57b0b"
    },
    bronzeColor: {
        type: OptionType.STRING,
        description: "ブロンズストリークの色（7日以上）",
        default: "#b08d57"
    },
    defaultColor: {
        type: OptionType.STRING,
        description: "デフォルトのストリークの色（1日以上）",
        default: "#f59e0b"
    }
});
