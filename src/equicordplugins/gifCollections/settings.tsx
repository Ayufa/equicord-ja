/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { OptionType } from "@utils/types";
import { Alerts, useState } from "@webpack/common";

import { DATA_COLLECTION_NAME, getCollections, refreshCacheCollection } from "./utils/collectionManager";
import { cl } from "./utils/misc";
import { downloadCollections, uploadGifCollections } from "./utils/settingsUtils";

export const SortingOptions = {
    NAME: 1,
    CREATION_DATE: 2,
    MODIFIED_DATE: 3,
} as const;

export const settings = definePluginSettings({
    itemPrefix: {
        description: "GIFアイテムのプレフィックス。",
        type: OptionType.STRING,
        default: "gc-item:",
        restartNeeded: true,
    },
    collectionPrefix: {
        description: "コレクションのプレフィックス。",
        type: OptionType.STRING,
        default: "gc:",
        restartNeeded: true,
    },
    onlyShowCollections: {
        description: "GIFピッカーにコレクションだけを表示します。",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true,
    },
    stopWarnings: {
        description: "削除確認ダイアログをスキップします。",
        type: OptionType.BOOLEAN,
        default: false,
    },
    showCopyImageLink: {
        description: "コンテキストメニューに画像リンクをコピーするオプションを表示します。",
        type: OptionType.BOOLEAN,
        default: false,
    },
    preventDuplicates: {
        description: "同じGIFをコレクションに複数回追加するのを防ぎます。",
        type: OptionType.BOOLEAN,
        default: false,
    },
    defaultEmptyCollectionImage: {
        description: "コレクションに画像がないときに表示される画像。",
        type: OptionType.STRING,
        default: "https://c.tenor.com/YEG33HsLEaIAAAAC/parksandrec-oops.gif",
    },
    collectionsSortType: {
        description: "コレクションの並び替えの種類。",
        type: OptionType.NUMBER,
        default: SortingOptions.NAME,
        hidden: true,
    },
    collectionsSortOrder: {
        description: "コレクションの並び順。",
        type: OptionType.STRING,
        default: "asc",
        hidden: true,
    },
    collectionsSort: {
        type: OptionType.COMPONENT,
        description: "コレクションの並び替え方法を決めます。",
        component: SortSettingsComponent,
    },
    importGifs: {
        type: OptionType.COMPONENT,
        description: "コレクションをインポートします。",
        component: () =>
            <Button onClick={async () =>
                (await getCollections()).length ? Alerts.show({
                    title: "本当によろしいですか？",
                    body: "コレクションをインポートすると、現在のコレクションが上書きされます。",
                    confirmText: "Import",
                    confirmColor: "danger",
                    cancelText: "Nevermind",
                    onConfirm: () => uploadGifCollections(),
                }) : uploadGifCollections()}>
                Import Collections
            </Button>,
    },
    exportGifs: {
        type: OptionType.COMPONENT,
        description: "コレクションをエクスポートします。",
        component: () =>
            <Button onClick={downloadCollections}>
                Export Collections
            </Button>,
    },
    resetCollections: {
        type: OptionType.COMPONENT,
        description: "コレクションをリセットします。",
        component: () =>
            <Button onClick={() =>
                Alerts.show({
                    title: "本当によろしいですか？",
                    body: "コレクションをリセットすると、すべてのコレクションが削除されます。",
                    confirmText: "Reset",
                    confirmColor: "danger",
                    cancelText: "Nevermind",
                    onConfirm: async () => {
                        await DataStore.set(DATA_COLLECTION_NAME, []);
                        refreshCacheCollection();
                    },
                })}>
                Reset Collections
            </Button>,
    },
});

function RadioOption({ name, value, checked, onChange, label }: { name: string; value: string | number; checked: boolean; onChange: () => void; label: string; }) {
    return (
        <div className={cl("sort-option")}>
            <label className={cl("sort-label")}>
                <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className={cl("sort-input")} />
                <BaseText className={cl("sort-text")} tag="div" size="sm">{label}</BaseText>
            </label>
        </div>
    );
}

function SortSettingsComponent() {
    const [sortType, setSortType] = useState(settings.store.collectionsSortType ?? SortingOptions.NAME);
    const [sortOrder, setSortOrder] = useState(settings.store.collectionsSortOrder ?? "asc");

    const handleSortType = (value: number) => {
        setSortType(value);
        settings.store.collectionsSortType = value;
    };

    const handleSortOrder = (value: string) => {
        setSortOrder(value);
        settings.store.collectionsSortOrder = value;
    };

    return (
        <div className={cl("sort-container")}>
            <Heading className={cl("sort-title")}>コレクションの並び替え</Heading>
            <Divider className={cl("sort-divider")} />
            <Paragraph className={cl("sort-description")}>コレクションの並び替え基準を選択してください</Paragraph>
            <Divider className={cl("sort-divider")} />
            <div className={cl("sort-section")}>
                <Paragraph className={cl("sort-section-title")}>並び替え基準</Paragraph>
                <RadioOption name="sortType" value={SortingOptions.NAME} checked={sortType === SortingOptions.NAME} onChange={() => handleSortType(SortingOptions.NAME)} label="名前" />
                <RadioOption name="sortType" value={SortingOptions.CREATION_DATE} checked={sortType === SortingOptions.CREATION_DATE} onChange={() => handleSortType(SortingOptions.CREATION_DATE)} label="作成日" />
                <RadioOption name="sortType" value={SortingOptions.MODIFIED_DATE} checked={sortType === SortingOptions.MODIFIED_DATE} onChange={() => handleSortType(SortingOptions.MODIFIED_DATE)} label="更新日" />
            </div>
            <Divider className={cl("sort-divider")} />
            <div className={cl("sort-section")}>
                <Paragraph className={cl("sort-section-title")}>順序</Paragraph>
                <RadioOption name="sortOrder" value="asc" checked={sortOrder === "asc"} onChange={() => handleSortOrder("asc")} label="昇順" />
                <RadioOption name="sortOrder" value="desc" checked={sortOrder === "desc"} onChange={() => handleSortOrder("desc")} label="降順" />
            </div>
        </div>
    );
}
