# Upstream attribution

Based on EmDash's official Cloudflare starter at release `emdash@1.3.1`:
https://github.com/emdash-cms/emdash/tree/12a179389f07821beb819a684e62627e6017ba8d/templates/starter-cloudflare

Copyright 2026 Cloudflare Inc. Distributed under the MIT license in `LICENSE`.

Local changes: pinned standalone npm dependencies, isolated Cloudflare resource
bindings, a Japanese trial entry page and basic styling, system fonts, disabled
image transforms, reproducible Worker minification, and trial documentation.

# Third-party notices

## tech-writing-pack

- 出典: hana652/tech-writing-pack — https://github.com/hana652/tech-writing-pack
- 取り込んだ版: commit `780f29a93e64b222f150956b04e5dd0d0eb821fe`（2026-10-08）
- ライセンス: Creative Commons Attribution 4.0 International（CC BY 4.0）。全文は `docs/tech-writing-pack/LICENSE`。
- 変更: なし。`docs/tech-writing-pack/` には上流のファイルを手を加えずに置いている。2026-10-31 に `vendor/tech-writing-pack/` から移した（中身は git の blob ID まで同じ）。移した理由は、執筆に使う環境の Read 禁止ルール `Read(./**/vendor/**)` でガイドが読めず、ガイドを読まずに公開前ゲートを判定していたため。
