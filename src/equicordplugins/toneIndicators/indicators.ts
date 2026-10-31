/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const defaultIndicators = new Map(
    Object.entries({
        j: "冗談",
        hj: "半分冗談",
        s: "皮肉",
        _sarc: "皮肉", // Alias for s
        gen: "本気",
        _g: "本気", // Alias for gen,
        genq: "本気の質問",
        _gq: "本気の質問", // Alias for genq
        srs: "真剣",
        nsrs: "真剣ではない",
        pos: "肯定的な含み",
        _pc: "肯定的な含み", // Alias for pos
        neu: "中立的な含み",
        neg: "否定的な含み",
        _nc: "否定的な含み", // Alias for neg
        p: "プラトニック",
        r: "ロマンチック",
        a: "アルテラス",
        c: "コピペネタ",
        l: "歌詞",
        _ly: "歌詞", // Alias for l
        lh: "軽い気持ちで",
        nm: "怒っていない",
        lu: "少し不快",
        nbh: "ここの誰に向けたものでもない",
        nay: "あなたに向けたものではない",
        ay: "あなた宛て",
        nsb: "当てつけではない",
        x: "性的な意図あり",
        _sx: "性的な意図あり", // Alias for x
        nx: "性的な意図なし",
        _nsx: "性的な意図なし", // Alias for nx
        rh: "修辞疑問",
        _rt: "修辞疑問", // Alias for rh
        t: "からかい",
        ij: "内輪ネタ",
        m: "比喩的に",
        li: "文字通りの意味で",
        hyp: "誇張表現",
        ex: "誇張",
        f: "フェイク",
        q: "引用",
        th: "脅し",
        cb: "クリックベイト",
        ref: "リファレンス",
        nf: "強制ではない",
        nbr: "無礼なつもりはない",
        ot: "脱線",
        nj: "冗談ではない",
        naj: "冗談ではない",
    }),
);

export default defaultIndicators;
