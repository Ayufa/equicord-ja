/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { DeleteIcon, PlusIcon } from "@components/Icons";
import { Devs, EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import { Select, TextInput, useState } from "@webpack/common";

const cl = classNameFactory("vc-bbr-");

interface BanReason {
    text: string;
    deleteSeconds?: number;
}

const DELETE_DURATION_OPTIONS = [
    { label: "Discord のデフォルト", value: null },
    { label: "何も削除しない", value: 0 },
    { label: "過去1時間", value: 3600 },
    { label: "過去6時間", value: 21600 },
    { label: "過去12時間", value: 43200 },
    { label: "過去24時間", value: 86400 },
    { label: "過去3日間", value: 259200 },
    { label: "過去7日間", value: 604800 },
];

function normalizeReason(r: BanReason | string): BanReason {
    return typeof r === "string" ? { text: r } : r;
}

function getStoredReasons(): BanReason[] {
    return (settings.store.reasons as (BanReason | string)[]).map(normalizeReason);
}

function ReasonsComponent() {
    const [reasons, setReasons] = useState<BanReason[]>(getStoredReasons);

    const update = (next: BanReason[]) => {
        setReasons(next);
        settings.store.reasons = next;
    };

    return (
        <section>
            <Heading>理由</Heading>
            {reasons.map((r, i) => (
                <div key={i} className={cl("reason-wrapper")}>
                    <TextInput
                        value={r.text}
                        onChange={v => update(reasons.map((x, j) => j === i ? { ...x, text: v } : x))}
                        placeholder="理由"
                    />
                    <Button
                        className={cl("remove-button")}
                        variant="secondary"
                        onClick={() => update(reasons.filter((_, j) => j !== i))}
                        size="min"
                    >
                        <DeleteIcon />
                    </Button>
                    <div className={cl("duration-row")}>
                        <span className="vc-text-base vc-text-sm vc-text-normal vc-text-defaultColor vc-plugins-setting-description">メッセージ自動削除の期間</span>
                        <Select
                            options={DELETE_DURATION_OPTIONS}
                            select={v => update(reasons.map((x, j) => j === i ? { ...x, deleteSeconds: v === null ? undefined : v } : x))}
                            isSelected={v => (v ?? null) === (r.deleteSeconds ?? null)}
                            serialize={v => v == null ? "default" : String(v)}
                        />
                    </div>
                </div>
            ))}
            <div className={cl("reason-wrapper")}>
                <Button
                    onClick={() => update([...reasons, { text: "" }])}
                    className={cl("add-button")}
                    size="medium"
                    variant="secondary"
                >
                    <PlusIcon /> Add another reason
                </Button>
            </div>
        </section>
    );
}

const settings = definePluginSettings({
    reasons: {
        description: "カスタム理由",
        type: OptionType.COMPONENT,
        default: [] as BanReason[],
        component: ReasonsComponent,
    },
    isTextInputDefault: {
        type: OptionType.BOOLEAN,
        description: 'デフォルトで選択メニューではなくテキスト入力を表示します。（「その他」オプションをクリックするのと同等です）'
    }
});

export default definePlugin({
    name: "BetterBanReasons",
    description: "Discord の BAN モーダルで使えるカスタム理由を作成したり、選択肢の代わりにテキスト入力をデフォルトで表示したりできます。",
    tags: ["Appearance", "Customisation"],
    authors: [Devs.Inbestigator, EquicordDevs.yonn2222],

    durationSetter: null as ((v: number) => void) | null,

    patches: [
        {
            find: "#{intl::BAN_REASON_OPTION_SPAM_ACCOUNT}",
            replacement: [
                {
                    match: /(\[\{name:\i\.\i\.\i\(\i\.\i\.\i\),.+?"other"\}\])/,
                    replace: "$self.getReasons($1)"
                },
                {
                    match: /useState\(null\)(?=.{0,300}targetUserId:)/,
                    replace: "useState($self.getDefaultState())"
                },
                {
                    match: /(\[\i,\i\])=(\i)\.useState\((null!=\i\?\i:\i)\)/,
                    replace: "$1=$self.captureDeleteState($2.useState,$3)"
                },
                {
                    match: /\i=\i\.useCallback\((\i)=>\{.{0,10},\i\(null\)(?=\},\[\]\))/,
                    replace: "$&,$self.onReasonSelect($1)"
                }
            ]
        }
    ],

    getReasons(defaults: { name: string; value: string; }[]) {
        const stored = getStoredReasons().filter(r => r.text.trim());
        return [
            ...stored.map(r => ({ name: r.text, value: r.text })),
            ...defaults,
        ];
    },

    getDefaultState: () => settings.store.isTextInputDefault ? 1 : 0,

    captureDeleteState(hook: (initial: number) => [number, (v: number) => void], initial: number) {
        const result = hook(initial);
        this.durationSetter = result[1];
        return result;
    },

    onReasonSelect(value: string) {
        const reason = getStoredReasons().find(r => r.text === value);
        if (reason?.deleteSeconds !== undefined) {
            this.durationSetter?.(reason.deleteSeconds);
        }
    },

    settings,
});
