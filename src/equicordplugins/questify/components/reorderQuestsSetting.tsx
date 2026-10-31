/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { JSX } from "react";

import { getQuestifySettings, useQuestifySettings } from "../settings/access";
import { defaultQuestOrder, type QuestOrderStatus, type QuestSubsort } from "../settings/def";
import { validateIgnoredQuests } from "../settings/ignoredQuests";
import { rerenderQuests } from "../settings/rerender";
import { type ManaSelectOption, SettingsCard, SettingsDescription, SettingsHeader, SettingsRow, SettingsRowItem, SettingsSelect, SettingsSubheader, SettingsSubtleSwitch } from "./shared";

const questStatusOptions = [
    { label: "未受け取り", value: "UNCLAIMED" },
    { label: "受け取り済み", value: "CLAIMED" },
    { label: "無視済み", value: "IGNORED" },
    { label: "期限切れ", value: "EXPIRED" },
] as const satisfies readonly { label: string, value: QuestOrderStatus; }[];

const questPositionManaOptions: ManaSelectOption[] = ["1番目", "2番目", "3番目", "4番目"].map((label, index) => ({
    id: String(index),
    label,
    value: String(index),
}));

questPositionManaOptions.push({ id: "hidden", label: "非表示", value: "hidden" });

const baseSubsortOptions = [
    { label: "追加順（新しい順）", value: "Recent DESC" },
    { label: "追加順（古い順）", value: "Recent ASC" },
] as const satisfies readonly { label: string, value: QuestSubsort; }[];

const expiringSubsortOptions = [
    ...baseSubsortOptions,
    { label: "期限順（早い順）", value: "Expiring ASC" },
    { label: "期限順（遅い順）", value: "Expiring DESC" },
] as const satisfies readonly { label: string, value: QuestSubsort; }[];

const expiredSubsortOptions = [
    ...baseSubsortOptions,
    { label: "期限切れ日時（新しい順）", value: "Expiring DESC" },
    { label: "期限切れ日時（古い順）", value: "Expiring ASC" },
] as const satisfies readonly { label: string, value: QuestSubsort; }[];

const claimedSubsortOptions = [
    ...baseSubsortOptions,
    { label: "受け取り日時（新しい順）", value: "Claimed DESC" },
    { label: "受け取り日時（古い順）", value: "Claimed ASC" },
] as const satisfies readonly { label: string, value: QuestSubsort; }[];

function toManaOptions(options: readonly { label: string, value: QuestSubsort; }[]): ManaSelectOption[] {
    return options.map(({ label, value }) => ({
        id: value,
        label,
        value,
    }));
}

const unclaimedSubsortManaOptions = toManaOptions(expiringSubsortOptions);
const claimedSubsortManaOptions = toManaOptions(claimedSubsortOptions);
const ignoredSubsortManaOptions = toManaOptions(expiringSubsortOptions);
const expiredSubsortManaOptions = toManaOptions(expiredSubsortOptions);
const subsortTooltips = {
    unclaimedSubsort: "完了済みで未受け取りのクエストは、未完了で未受け取りのクエストの下に残り、その各グループ内でこのサブソートが適用されます。",
    claimedSubsort: "受け取り済みのクエストは、受け取り日時またはクエストが追加された日時で並び替えられます。",
    ignoredSubsort: "無視済みのクエストは無視グループの位置を維持し、そのグループ内の順序はこのサブソートで決まります。",
    expiredSubsort: "期限切れのクエストは、期限日時またはクエストが追加された日時で並び替えられます。",
} as const;

function sanitizeQuestOrder(order: unknown): QuestOrderStatus[] {
    const validStatuses = new Set<QuestOrderStatus>(defaultQuestOrder);
    const sanitized = Array.isArray(order)
        ? order.filter((status): status is QuestOrderStatus => validStatuses.has(status as QuestOrderStatus))
        : [];
    const uniqueOrder = Array.from(new Set(sanitized));

    for (const status of defaultQuestOrder) {
        if (!uniqueOrder.includes(status)) {
            uniqueOrder.push(status);
        }
    }

    return uniqueOrder;
}

export function ReorderQuestsSetting(): JSX.Element {
    const reorderQuests = useQuestifySettings([
        "disableQuestsEverything",
        "questOrder",
        "hiddenQuestStatuses",
        "unclaimedSubsort",
        "claimedSubsort",
        "ignoredSubsort",
        "expiredSubsort",
        "rememberQuestPageSort",
        "rememberQuestPageFilters",
    ]);

    const disabled = reorderQuests.disableQuestsEverything;
    const questOrder = sanitizeQuestOrder(reorderQuests.questOrder);

    function updateQuestOrder(status: QuestOrderStatus, value: string | string[] | null): void {
        if (typeof value !== "string") return;

        const hiddenStatuses = new Set(reorderQuests.hiddenQuestStatuses);

        if (value === "hidden") {
            hiddenStatuses.add(status);
            getQuestifySettings().hiddenQuestStatuses = Array.from(hiddenStatuses);
            validateIgnoredQuests();
            return;
        }

        const index = Number(value);

        if (!Number.isInteger(index) || index < 0 || index >= questOrder.length) return;

        const nextOrder = [...questOrder];
        const previousIndex = nextOrder.indexOf(status);

        nextOrder[previousIndex] = nextOrder[index];
        nextOrder[index] = status;
        hiddenStatuses.delete(status);
        getQuestifySettings().questOrder = nextOrder;
        getQuestifySettings().hiddenQuestStatuses = Array.from(hiddenStatuses);
        validateIgnoredQuests();
    }

    function updateSubsort(key: "unclaimedSubsort" | "claimedSubsort" | "ignoredSubsort" | "expiredSubsort", value: string | string[] | null): void {
        if (typeof value !== "string") return;

        getQuestifySettings()[key] = value;
        rerenderQuests();
    }

    function updateRememberSetting(key: "rememberQuestPageSort" | "rememberQuestPageFilters", checked: boolean): void {
        getQuestifySettings()[key] = checked;
    }

    return (
        <SettingsCard>
            <SettingsHeader> クエストの並び替え </SettingsHeader>
            <SettingsDescription> クエストページで Questify の並び替えオプションが選択されているときに、クエストをステータスごとに並び替えます。非表示のステータスは、どの並び替えオプションでも除外されます。 </SettingsDescription>
            <SettingsSubheader> ステータスの順序 </SettingsSubheader>
            <SettingsRow>
                {questStatusOptions.map(({ label, value: status }) => (
                    <SettingsRowItem key={status}>
                        <SettingsSelect
                            label={`${label}:`}
                            options={questPositionManaOptions}
                            value={reorderQuests.hiddenQuestStatuses.includes(status) ? "hidden" : String(questOrder.indexOf(status))}
                            selectionMode="single"
                            disabled={disabled}
                            fullWidth={true}
                            maxOptionsVisible={questPositionManaOptions.length}
                            onSelectionChange={value => updateQuestOrder(status, value)}
                            tooltip={{
                                position: "top",
                                text: "埋まっている位置を選択すると、2つのステータスが入れ替わります。非表示のステータスはクエスト一覧から除外されます。"
                            }}
                        />
                    </SettingsRowItem>
                ))}
            </SettingsRow>
            <SettingsSubheader> サブソート </SettingsSubheader>
            <SettingsRow>
                <SettingsRowItem>
                    <SettingsSelect
                        label="未受け取りのサブソート:"
                        options={unclaimedSubsortManaOptions}
                        value={reorderQuests.unclaimedSubsort}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        maxOptionsVisible={unclaimedSubsortManaOptions.length}
                        onSelectionChange={value => updateSubsort("unclaimedSubsort", value)}
                        tooltip={{
                            position: "top",
                            text: subsortTooltips.unclaimedSubsort
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem>
                    <SettingsSelect
                        label="受け取り済みのサブソート:"
                        options={claimedSubsortManaOptions}
                        value={reorderQuests.claimedSubsort}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        maxOptionsVisible={claimedSubsortManaOptions.length}
                        onSelectionChange={value => updateSubsort("claimedSubsort", value)}
                        tooltip={{
                            position: "top",
                            text: subsortTooltips.claimedSubsort
                        }}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsRow>
                <SettingsRowItem>
                    <SettingsSelect
                        label="無視済みのサブソート:"
                        options={ignoredSubsortManaOptions}
                        value={reorderQuests.ignoredSubsort}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        maxOptionsVisible={ignoredSubsortManaOptions.length}
                        onSelectionChange={value => updateSubsort("ignoredSubsort", value)}
                        tooltip={{
                            position: "top",
                            text: subsortTooltips.ignoredSubsort
                        }}
                    />
                </SettingsRowItem>
                <SettingsRowItem>
                    <SettingsSelect
                        label="期限切れのサブソート:"
                        options={expiredSubsortManaOptions}
                        value={reorderQuests.expiredSubsort}
                        selectionMode="single"
                        disabled={disabled}
                        fullWidth={true}
                        maxOptionsVisible={expiredSubsortManaOptions.length}
                        onSelectionChange={value => updateSubsort("expiredSubsort", value)}
                        tooltip={{
                            position: "top",
                            text: subsortTooltips.expiredSubsort
                        }}
                    />
                </SettingsRowItem>
            </SettingsRow>
            <SettingsSubheader> クエストページの記憶 </SettingsSubheader>
            <SettingsSubtleSwitch
                checked={reorderQuests.rememberQuestPageSort}
                disabled={disabled}
                label="選択したクエストページの並び替えを記憶する:"
                onChange={checked => updateRememberSetting("rememberQuestPageSort", checked)}
                bottomSpacing="5"
                tooltip={{
                    position: "top",
                    text: "無効にすると、クエストページは毎回 Questify の並び替えオプションで開きます。"
                }}
            />
            <SettingsSubtleSwitch
                checked={reorderQuests.rememberQuestPageFilters}
                disabled={disabled}
                label="選択したクエストページのフィルターを記憶する:"
                onChange={checked => updateRememberSetting("rememberQuestPageFilters", checked)}
                tooltip={{
                    position: "top",
                    text: "無効にすると、クエストページは毎回タスクや報酬のフィルターなしで開きます。"
                }}
            />
        </SettingsCard>
    );
}
