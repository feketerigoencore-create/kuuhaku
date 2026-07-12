
---

## 後日談（2026-07-04）：配信2日でオファーが停止 → 監視して即ストップ

game-test-01 は配信好調（2日で約26,052表示・$8.62消化・実効CPM$0.33）だったが、**コンバージョンは0**。
原因：MyLeadの「破損リンク(Damaged links)」通知 → **オファー「Mini Games - Android - MX」が“プログラムがアクティブではありません（＝停止）”**。エラー19,225件。送客した約2.6万visitが**死んだオファー**に着地していた。

対応：**HilltopAdsのキャンペーンを即トラフィックオフ**（死んだ案件への出血を停止）。消化$8.62・残高約$92。

**核心の教訓（実地でしか学べない）：**
> **オファーは予告なく停止する。** 「配信して放置」は死んだ案件に広告費を垂れ流す最大の事故。**成果が出ているか＋オファーが生きているかを監視し、止まったら即ストップ or 差し替える**のが鉄則。今回それを$8.62で体験。

**学習1周の到達点：** 開設→入金→審査突破(8回目)→配信→実データ→「オファー死亡」という現実の事故→監視して停止、まで完走。**“稼ぐ力”の地図は完全に手に入った。**

---

## 2026-07-05 追記：BeMob計測チェーンを構築（お金ゼロ）

MyLead徹底調査の結論（既に承認済みの出会い系SOI「Jointhedating - tier1」を主役に）を受け、BeMobで計測の「配管」を実際に構築した。すべて課金ゼロ。

**作成したもの（BeMob / アカウント: matuoka）:**
1. **Affiliate Network「MyLead」** … postback URLを発行（`https://kuw0w.bemobtrcks.com/postback?cid=REPLACE&payout=OPTIONAL…`）
2. **Offer「Global - Jointhedating - Tier1 SOI」** … URL=`https://link-check.click/a/ADVEltZvyIQlXN`／Click ID Parameter=`ml_sub1`（BeMobのclick_idをMyLeadに受け渡す）／Payout=Manual $1.94／Network=MyLead
3. **Campaign「HTA - Jointhedating - Tier1 pop」** … Traffic source=HilltopAds／Built-In Flow／Direct linking（LPなし直リンク）／Redirect 302／Offer=上記100%
   - Campaign URL（HilltopAdsに入れる）: `https://kuw0w.bemobtrcks.com/go/9931ea9c-77bf-4c2f-8759-d821d8e034f8?…`（HilltopAdsトークン付き）
   - 既存の Traffic Source「HilltopAds」テンプレは流用

**残タスク（お金を使う直前で停止・要判断）:**
- ★**トラッキングドメイン判断**：現状は共有デフォルト `kuw0w.bemobtrcks.com`。HilltopAds審査での共有ドメイン汚染リスクを避けるなら、独自クリーンドメイン `track.livenight-guide.com` をBeMobに追加＋DNSにCNAME1本（DNSアクセス要）。
- MyLead側のPostback設定（BeMobのpostback URLを貼り、cid=MyLeadのml_sub1マクロ、payoutをマッピング）※MyLeadの正確なマクロ名を要確認
- HilltopAdsでキャンペーン作成→**無料審査に提出**（着地ドメインの壁をタダで判定）
- 通れば $20だけ入金して計測つき配信 → read→cut→scale

---

## 2026-07-05 追記2：BeMob不採用 → 直リンク+subidでHilltopAds審査に提出（お金ゼロ）

**ドメイン評判の判定結果:**
- `bemobtrcks.com`（BeMob共有）= **GSB「危険」（フィッシング）** → HilltopAdsは確実却下 → **BeMob不採用**（独自ドメインは月$249で見送り）。
- `link-check.click`（MyLead offer link）= **GSBクリーン ＋ VT 1/91**（無名1社のみ）= 前回承認のgame-test-01（1/92+GSB安全）と同水準 → 合格ライン。

**方針転換:** BeMobを挟まず、`HilltopAds → link-check.click → 最終ページ` の最短クリーンチェーン。zone計測は**リンクに `?ml_sub1={{zoneid}}` を付与し、MyLeadのsub-ID別レポート**で無料実現（postback不要）。

**HilltopAdsキャンペーン作成・提出（ID 936437 "dating-jth-01"）:**
- Popunder mobile / Smart CPM / Non-Mainstream(18+) High Activity / GEO=US
- URL: `https://link-check.click/a/ADVEltZvyIQlXN?ml_sub1={{zoneid}}`
- Proxy=Disallow（bot対策）／Daily $20・Total $20（二重上限）／**自動配信OFF**
- 相場: US non-mainstream pop = Premium $7.41 / 推奨 $4.94 / 最低 $3.91 CPM（$20で約4,000〜5,000表示）
- **状態: PENDING（審査中・最大24h）/ TRAFFIC OFF。承認されても自動課金しない。**

**次:** 審査結果（承認/却下）を確認 → 承認なら本人承認のうえ配信ON（$20）→ MyLeadのsub-ID別で成約zoneを読む。却下ならゲーム案件へ。

---

## 2026-07-07 追記：A案（LP入口）でHilltopAds再審査に提出できた

- 前回の「Invalid link」却下＝GEOロック着地(link-check.click/unsupportedcountry)を審査botが見た可能性 → **LP(livenight-guide.com)を入口**にして解決を図る。
- LPを**出会い系版に作り替え**（cam→dating、案件リンク link-check.click/a/ADVEltZvyIQlXN、zone受け渡し ml_sub1）、**Netlifyに再デプロイ**（Chrome file_uploadでindex.htmlを差し替え、ライブ表示を確認）。
- HilltopAdsで新キャンペーン作成時、フォームが「URL is invalid」で送信拒否に見えた → **JSで確認したところ、そのエラー要素は `display:none`（非表示）＝誤検知**。真因は**品質ガイドライン確認トグル未チェック**（refクリックが裏の隠しinputに当たっていた）。**見える緑トグルを座標クリック**で解決。
- 結果：**`dating-jth-02`(ID 937744) = PENDING / TRAFFIC OFF / Daily$20・Total$20 / 自動配信OFF**。URL=`https://livenight-guide.com/?subid={{zoneid}}`。お金は未使用。
- 次：審査結果（承認/却下）を確認 → 承認なら本人承認で$20配信 → MyLead sub-ID別で成約zoneを読む。却下ならゲーム案件へ。

---

## 2026-07-07 追記：C案（ゲームinstall）でHilltopAds審査に提出できた

- dating(dating-jth-02)は却下：理由「Unacceptable offer.（中身NG）＋Empty targeting.（GEO未保存）」。①の中身の壁が固いので**datingは切り上げ**。
- **ゲームinstallへ切替**（着地=Google Play=クリーン＝前回 game-test-01 が承認された型）。MyLeadで Fruit Puzzle Crush のリンク取得：`https://sungoclick.space/a/J6okxfK4w2IvJRj`。
- HilltopAdsで新キャンペーン作成。**フォームの重要な学び**：カスタムのトグル/チェックは通常クリック（座標/ref）だとAngularモデルに反映されないことがある（"Empty targeting"/"accepted OSs"エラーの原因）。**JSのネイティブ `input.click()` で確実に反映**。「URL invalid」表示は多くが `display:none` の非表示要素＝誤検知。
- 設定：Popunder mobile / CPM / **Mainstream High Activity** / GEO=US / OS絞りはOFF(空OS要件回避) / URL=`https://sungoclick.space/a/J6okxfK4w2IvJRj?ml_sub1={{zoneid}}` / 自動配信OFF / 品質確認ON / 総予算$20上限。
- 結果：**`game-fpc-01`(ID 940855) = PENDING / TRAFFIC OFF / Total$20**。お金未使用。
- 次：審査結果を確認 → 承認なら本人承認で$20配信（要OS=Android追記）→ MyLead sub-ID別で成約zoneを読む。
