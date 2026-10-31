# サイトマップのインデックスを差し替える理由と、件数の数え方（2026-10-31）

結論: `/sitemap.xml` はこのリポジトリの `src/pages/sitemap.xml.ts` が返す。EmDash の組み込みの子サイトマップ（`/sitemap-posts.xml`、`/sitemap-pages.xml`）と、サイト側で書いたページの `/static-sitemap.xml` を並べる。子サイトマップを載せるかどうかは、組み込みの子サイトマップが載せるエントリと同じ条件で数えて決める。数えるための問い合わせが失敗したら 503 を返す。

## 差し替える理由

組み込みのサイトマップは、コレクションの子サイトマップしか作らない。トップ、記事一覧、タグ、カテゴリ、`/privacy` は入らない（https://docs.emdashcms.com/guides/seo/ 、2026-10-31 確認）。

## 組み込みの子サイトマップが載せるもの

同じページに次のように書かれている（2026-10-31 確認）。

- 「A collection sitemap lists entries that are published, not deleted, have a slug, and are not hidden from search engines.」
- 「Each child sitemap holds up to 2,000 entries」。続きは `/sitemap-{collection}-2.xml` 以降。
- インデックスは「at least one listed entry」があるコレクションだけを載せる。

載せるエントリが 0 件のコレクションの子サイトマップは 404 になる。2026-10-31 にローカルで、公開済みで「検索エンジンに表示しない」を付けた固定ページだけがある状態を作ると、`/sitemap-pages.xml` は 404 だった。

## 数え方

| 条件 | どこで見るか |
|---|---|
| 公開済み、削除されていない | `getEmDashCollection(collection, { status: "published" })` が返すものだけを数える |
| slug がある | `entry.data.slug` |
| 検索エンジンから隠していない | D1 の `_emdash_seo` で `seo_no_index = 1` の `content_id`（エントリの ULID）を除く |

最後の条件だけ EmDash の内部のテーブルを読んでいる。`getEmDashCollection` の結果には SEO の値が入らず、`getSeoMeta()` の `robots` も null になった（2026-10-31 にローカルで確認。そのせいで、最初の実装は上の固定ページの子サイトマップを載せ、404 になった）。公開 API には SEO をまとめて引く関数が無く、1件ずつの `getEmDashEntry` は記事の数だけ D1 に問い合わせるので使わない（https://docs.emdashcms.com/reference/api/ 、2026-10-31 確認）。

## エラーのとき

`getEmDashCollection` はエラーを投げずに `result.error` に入れる（reference/api）。以前の実装はこれを見ておらず、問い合わせの失敗を「0 件」と数えて、記事があるのに子サイトマップの無いインデックスを返していた（`Cache-Control: public, max-age=3600` で1時間キャッシュされる）。今は `result.error` があるとき、`_emdash_seo` が読めないとき、`/static-sitemap.xml` で `getTaxonomyTerms` が投げたときに、`503`（`Cache-Control: no-store`、`Retry-After: 300`）を返す。

## EmDash の版を上げたとき

`_emdash_seo` の `collection`、`content_id`、`seo_no_index` は EmDash の内部の列なので、版を上げたら次を確かめる。

1. `npm run build` のあと `npx wrangler dev --local --persist-to <スクラッチパッドの新しいフォルダ>` で起動し、管理画面のセットアップを済ませる。
2. 公開済みの固定ページを1つ作り、SEO パネルで「検索エンジンに表示しない」を付ける。
3. `/sitemap.xml` に `/sitemap-pages.xml` が載っていないこと、載っている子サイトマップがすべて 200 を返すことを確かめる。
4. `/sitemap.xml` が 503 になったら、`_emdash_seo` の列が変わっている。`wrangler d1 execute DB --local --persist-to <同じフォルダ> --command "SELECT sql FROM sqlite_master WHERE name='_emdash_seo'"` で今の列を見て、`src/pages/sitemap.xml.ts` を直す。
