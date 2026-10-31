/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Select } from "@webpack/common";

import { ListType } from "..";

export function ListPrioritySelector({ listType, setListPriority }: { listType: ListType; setListPriority: (v: ListType) => void; }) {
    return (
        <Select
            options={[
                { label: "ホワイトリスト", value: ListType.Whitelist },
                { label: "ブラックリスト", value: ListType.BlackList }
            ]}
            placeholder={"リストの種類を選択"}
            isSelected={v => v === listType}
            closeOnSelect={true}
            select={setListPriority}
            serialize={v => v}
        />
    );
}
