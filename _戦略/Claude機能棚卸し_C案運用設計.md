# Claude Code / Cowork 最新機能の棚卸し → C案運用への適用設計

**作成日:** 2026年6月27日　**全機能の確認日:** 2026-06-27
**対象:** アダルト系アフィリエイト C案（資産型・片手間運用）の自動化・省力化

---

## 0. 前提と重要な注意（先に読む）

**(1) 機能は更新が速い。** 本書は下記の公式一次情報（docs.claude.com / support.claude.com / anthropic.com）を 2026-06-27 に確認した内容に基づく。各機能に確認日とソースURLを付した。記載のない挙動は「要確認」と明記している。実運用前に必ず最新版で再確認すること。

**(2) アダルト本文の自動生成には構造的な制約がある（最重要）。** Claude（Cowork / Claude Code いずれも）は Anthropic の利用ポリシー（Usage Policy）下で動作する。性的に露骨な本文そのものの「量産」は、ツール側が拒否・トーンダウンする可能性が高い。したがって C案の「本文ドラフト量産」は、**Claudeを"露骨表現の生成器"として使う設計にすると破綻しやすい**。本書では、Claudeの強みが出る部分（構成設計・比較表・スペック整理・SEO骨子・コンプラ点検・数字集計・実装）に寄せ、露骨表現は人間が最終付与する半自動設計を推奨している。これは倫理面でなく「ツールの仕様上そうなる」という実務上の前提。

**(3) 自走の物理的な制約。** Cowork のスケジュール実行は「PCが起きていて Claude Desktop が開いている間だけ」動く（スリープ/アプリ終了中はスキップ→復帰後に自動実行）。完全クラウド常駐は Claude Code の `/schedule`（クラウドジョブ）側。片手間運用では、この差が設計の肝になる。

---

# パートA：最新機能の棚卸し

## A-1. Claude Code の最新機能

| 機能                                        | 概要（C案で効く点）                                                                                                          | 自走/自動の度合い | 確認日        | 公式ソース                                                                                                                                                                                             |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| サブエージェント（Subagents）                       | 専門タスクを別コンテキストで並列実行。`.claude/agents/` に .md を置いて定義（名前・色・ツール・権限・モデルを個別指定可）。`use subagents` と書くだけでも発火                  | 半自動〜自動    | 2026-06-27 | [sub-agents](https://docs.claude.com/en/docs/claude-code/sub-agents) / [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                             |
| ワークツリー分離（isolation: worktree）             | 各サブエージェントを独立したgit worktreeで動かし、大量の並列変更を安全に。`/batch` で移行作業を数十〜数百エージェントに分散                                            | 自動        | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| ダイナミックワークフロー（Dynamic Workflows）※リサーチプレビュー | Claudeがタスクを計画し、JavaScriptスクリプトで**数百の並列サブエージェント**を1セッションで統括。コードベース監査・大規模移行・相互検証リサーチ向け。**Enterprise / Team / Max 限定** | 自動        | 2026-06-27 | [workflows](https://code.claude.com/docs/en/workflows) / [Opus 4.8](https://www.anthropic.com/news/claude-opus-4-8)                                                                               |
| Hooks（フック）                                | ライフサイクルの特定点で決定論的にコマンド実行。`PostToolUse`で編集後に自動整形、`Stop`で長時間タスクの自己チェック、`PermissionRequest`で承認をSlack等へ転送                | 自動        | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips) / [hooks](https://code.claude.com/docs/en/hooks)                                                   |
| バックグラウンドタスク                               | devサーバ等の長時間プロセスを止めずに他作業を継続                                                                                          | 自動        | 2026-06-27 | [autonomous post](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)                                                                                                  |
| チェックポイント（Checkpoints）                     | 変更前のコード状態を自動保存。Esc2回 / `/rewind` で巻き戻し。大胆な自走を安全に                                                                    | 半自動       | 2026-06-27 | [autonomous post](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)                                                                                                  |
| `/loop`（ローカル定期実行）                         | 最大3日間、ローカルで繰り返しタスク。例：`/loop 1h /pr-pruner`。**PCが起きている間**動く                                                          | 半自動       | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| `/schedule`（クラウドジョブ）                      | `/loop`と違い**クラウドで実行＝ノートPCを閉じても動く**。日次ジョブ等。MCP連携で結果をSlack通知も可                                                        | 自動        | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| MCP連携                                     | Slack / BigQuery / Sentry 等を接続しデータ取得・分析・通知。HTTP/設定ファイルで定義                                                           | 半自動       | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| プラグイン / マーケットプレイス                         | LSP・MCP・スキル・エージェント・フックを束ねて配布。`/plugin`で導入。組織内マーケットプレイスも可                                                            | 半自動       | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| デスクトップ版 / VS Code拡張                       | Desktopアプリは**Webサーバを自動起動してブラウザで検証**まで内蔵。VS Code拡張（beta）はサイドバーでインライン差分表示                                             | 半自動       | 2026-06-27 | [autonomous post](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously) / [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips) |
| モバイル / リモート制御                             | モバイルアプリのCodeタブ、`/remote-control`でスマホから操作、`--teleport`でセッション移動。*Max/Team/Ent, v2.1.74+*                              | 半自動       | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| 自動モード / サンドボックス / 権限                      | `--enable-auto-mode`で安全操作を自動承認、`/sandbox`でファイル・ネット分離、`/permissions`で安全コマンドを事前許可                                     | 自動        | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| メモリ（CLAUDE.md / `/memory` / `/dream`）     | 設定・修正・パターンをセッション間で保持。`/dream`で古い記憶を整理統合                                                                             | 自動        | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips)                                                                                                    |
| Agent SDK                                 | Claude Code と同じツール・コンテキスト管理・権限基盤で独自エージェントを構築（サブエージェント/フック対応）                                                        | —         | 2026-06-27 | [autonomous post](https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously)                                                                                                  |

**モデル（2026-06-27時点）:** コード大規模移行で `Opus 4.8` が言及される最新世代。Claude Code既定は世代更新あり（`/model`で切替）。`/effort`でlow/medium/high/maxの推論強度を選択。

## A-2. Cowork の最新機能

| 機能 | 概要（C案で効く点） | 自走/自動の度合い | 確認日 | 公式ソース |
|---|---|---|---|---|
| エージェント自走タスク | ゴールを渡すと計画→サブタスク分解→VM内でコード/シェル実行→成果物をファイルに出力。会話タイムアウト無しで長時間実行 | 自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| サブエージェント協調 | 複雑作業を分割し並列ワークストリームを統括 | 自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| ローカルファイル直接アクセス | アップ/ダウン無しで指定フォルダを読み書き。成果物を直接ファイルシステムへ | 自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| スケジュール実行（定期タスク） | `/schedule` または左サイドバー「Scheduled」から作成。**hourly/daily/weekly/weekdays/manual**。プロンプト・モデル・作業フォルダを保存し自動実行。各タスクは独立Coworkセッション。**PCが起きてDesktopが開いている間のみ**（スリープ中はスキップ→復帰後自動実行） | 自動 | 2026-06-27 | [Schedule recurring tasks](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork) |
| プロジェクト（Projects） | 関連タスクを独自のファイル・指示・**メモリ**付きワークスペースにまとめる。再発・長期作業向け（メモリはプロジェクト内のみ保持） | 半自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| プロフェッショナル出力 | Excel（動くVLOOKUP・条件付き書式・複数タブ）、PowerPoint、整形済みドキュメント。Claude for Excel/PowerPointで追加編集も | 半自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| ドラフトのその場編集 | Markdownドラフトの一部を選択→「Edit with Claude」でその場修正 | 手動補助 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| プラグイン | スキル・コネクタ・サブエージェントを束ねて役割別に導入。Plugin Createで自作も。Anthropic製は[GitHub](https://github.com/anthropics/knowledge-work-plugins) | 半自動 | 2026-06-27 | [Use plugins in Cowork](https://support.claude.com/en/articles/13837440-use-plugins-in-cowork) |
| コネクタ（MCP） | Google Drive / Gmail / Slack / DocuSign 等に接続 | 半自動 | 2026-06-27 | [Use plugins in Cowork](https://support.claude.com/en/articles/13837440-use-plugins-in-cowork) |
| グローバル / フォルダ指示 | 全セッション共通の標準指示（トーン・出力形式・前提）と、フォルダ単位のプロジェクト文脈 | 半自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| 権限モード | 「Ask before acting」（毎回承認）/「Act without asking」（無停止・高速だが要監督）。**削除は常に明示承認** | — | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| モバイルからの指示（Pro/Max） | スマホから指示→デスクトップが裏で実行→同じ会話に結果。**デスクトップは起動継続が必要** | 半自動 | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| VM分離アーキテクチャ | シェル/コードは隔離VMで実行。ネットアクセスはegress設定に従う | — | 2026-06-27 | [Get started](https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork) |
| Dispatch（リモート制御） | Claude DesktopをスマホやWebから安全に遠隔操作（MCP・ブラウザ・PC操作） | 半自動 | 2026-06-27 | [power user tips](https://support.claude.com/en/articles/14554000-claude-code-power-user-tips) |

**制約（要注意）:** ①メモリはプロジェクト内のみ（単発セッションは横断保持なし）②セッション共有不可 ③Web/モバイル単体では不可（Desktop必須）④アプリ終了/スリープでアクティブタスク停止。

## A-3. Claude in Chrome（ブラウザ自動化）— 連携で効く

| 機能 | 概要 | 確認日 | 公式ソース |
|---|---|---|---|
| ブラウザ操作 | サイドパネルで読み取り・クリック・ナビゲート。Slack/Gmail/GCal/GDocs/GitHub等は組込みナビ知識あり | 2026-06-27 | [Get started Chrome](https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome) |
| ワークフロー記録（Record） | 自分で手順を実演→Claudeが学習し再現。ショートカット保存 | 2026-06-27 | 同上 |
| スケジュール実行 | ショートカットを daily/weekly/monthly/annually で自動実行（時計アイコン） | 2026-06-27 | 同上 |
| Claude Code連携 | build（Code）→test/verify（Chrome）。コンソールログ・ネットワーク・DOMを直接読み実装検証 | 2026-06-27 | 同上 |
| デスクトップから制御 | Claude Desktopのタスクからブラウザ作業を実行（コネクタをオンに） | 2026-06-27 | 同上 |
| モデル | Pro=Haiku 4.5 / Max・Team・Ent=Opus 4.7・Sonnet 4.6・Haiku 4.5から選択 | 2026-06-27 | 同上 |

## A-4. 連携・使い分け（最新版での最適配分）

| 観点 | Cowork（Desktop） | Claude Code | 結論 |
|---|---|---|---|
| 得意領域 | 文書・データ・ファイル・リサーチ・非エンジニア作業 | コード実装・リポジトリ操作・サイト構築 | 役割で分ける |
| 定期実行 | スケジュールタスク（PC起動中のみ） | `/schedule`＝**クラウド常駐**、`/loop`＝ローカル最大3日 | **常時回したい監視系はClaude Code `/schedule`**、成果物生成系はCowork |
| 成果物 | xlsx/pptx/docx/md を直接生成 | コード・PR・サイト更新 | リサーチ/記事/集計=Cowork、実装=Code |
| 操作性 | ターミナル不要・GUI | ターミナル/VS Code/Desktop | 片手間運用の主役はCowork、実装フェーズだけCode |
| ブラウザ | Chrome連携で投稿・順位確認 | Chrome拡張でフロント検証 | SNS投稿/順位取得はChrome＋Cowork |

> **片手間運用の基本方針:** 日常はCoworkを母艦にし、サイト実装の局面だけClaude Codeに降りる。「PCを閉じても回したい監視・通知」だけはClaude Codeの`/schedule`（クラウド）に逃がす。

---

# パートB：C案運用への適用設計（マッピング）

凡例 — **自動**=人は結果確認のみ／**半自動**=Claude生成→人が承認・微修正／**手動**=人が主体（Claudeは補助）

| # | 作業 | 使う機能 | 自動化度 | 想定の組み方（誰に何を） | 片手間の頻度 |
|---|---|---|---|---|---|
| 1 | **案件・競合・KW定点調査** | Cowork スケジュールタスク（weekly）＋Web検索/Web fetch＋Chrome連携（順位・競合ページ取得）＋Excel出力 | **自動** | 「競合リサーチ・サブエージェント」に競合URL群・KWリストを定点巡回させ、差分を週次レポート（md＋xlsx）化。Claude Code `/schedule`にすればPC閉じても可 | 週1（結果を5分確認） |
| 2 | **比較/レビュー記事の構成・本文ドラフト** | Cowork（構成・比較表・スペック整理・SEO骨子をmd生成）＋プロジェクトのメモリ（トンマナ・テンプレ保持）＋ドラフトその場編集 | **半自動** | 「記事設計サブエージェント」が骨子・H2/H3・比較表・FAQ・内部リンク案まで生成。**露骨表現は人間が最終付与**（※前提(2)）。Claudeは"枠と素材"担当 | 週1〜2（1本30〜60分の仕上げ） |
| 3 | **コンプラチェック（薬機法・景表法・PR表記）** | Cowork スキル/サブエージェント（自己点検チェックリスト化）＋プロジェクト指示にNGワード規程を常駐 | **半自動** | 「コンプラ点検サブエージェント」に薬機法/景表法/ステマ規制(PR表記)の自己点検リストで全記事を走査させフラグ＆代替表現を提案。**最終判断は人間**（法的責任の所在） | 公開前に毎回（自動走査→人が承認） |
| 4 | **SNS投稿文の作成・運用** | Cowork（記事から投稿文を派生生成）＋Claude in Chrome（投稿・予約）＋スケジュールタスク | **半自動** | 記事1本→X/各SNS用に文面・ハッシュタグ複数案を生成。Chromeのワークフロー記録＋スケジュールで投稿を半自動化。**プラットフォーム規約とアダルト表現規制の確認は人間** | 週次まとめ生成→随時投稿 |
| 5 | **サイト実装・更新** | Claude Code（サブエージェント＋worktree、checkpoints、Desktopでブラウザ検証）＋Chrome拡張で表示確認＋hooks（整形/テスト） | **自動寄りの半自動** | 「実装エージェント」がテンプレ反映・記事流し込み・内部リンク・スキーマ。`Stop`フックでビルド/リンク切れ自己チェック。人はPR承認 | 記事公開時・テンプレ改修時 |
| 6 | **数字（流入・CV・継続報酬）の集計とレビュー** | Cowork（CSV/API取込→Excel集計→グラフ）＋スケジュールタスク（週次/月次）＋**Coworkアーティファクト**（連結データの常設ダッシュボード） | **自動** | 「集計サブエージェント」がGA/ASP管理画面DL（ChromeまたはMCP）→KPI表・前週比・異常値検知。アーティファクト化して毎回最新を表示 | 週1（ダッシュボードを5分確認） |

**補足:** 作業2・3・4はアダルト表現が絡むため「Claudeは構造・素材・点検」、「人間は露骨表現・最終法的判断・規約適合」に責任分界するのが、ツール仕様上も実務上も安定する。

---

# パートC：実装プラン

## C-1. 最新版オペレーション構成図

> 構成図は別ファイル **`C案_運用構成図.svg`** を参照（このフォルダ内）。
> 全体像：Cowork（母艦）を中心に、定点調査・記事設計・コンプラ点検・集計の各サブエージェントがぶら下がり、実装はClaude Code、投稿・順位取得・管理画面DLはClaude in Chrome、常時監視はClaude Codeの`/schedule`（クラウド）に逃がす二層構成。

## C-2. 定期実行で回せる部分（具体的な組み方）

**(a) 週次・定点調査（推奨：まずCoworkスケジュール、PC運用が不安定ならClaude Code `/schedule`）**

- Cowork で `/schedule` → 頻度 weekly（例：月曜朝）→ 作業フォルダにC案サイトを指定。
- プロンプト雛形：
  > 「`/competitors.md`の競合URLと`/keywords.md`のKWについて、各ページのタイトル・見出し・訴求・更新有無を取得し、前回（`/research/前回.md`）との差分を要約。新規上位ページとKW機会を`/research/YYYY-MM-DD.md`に、KPIを`/research/tracker.xlsx`に追記。」
- 結果はファイルで残るので、人は差分サマリだけ確認。
- **PCを閉じても回したい場合**は同じ内容をClaude Codeの`/schedule`（クラウドジョブ）に置き換える。

**(b) 記事ドラフトの定期生成（半自動）**

- Coworkプロジェクトを「C案-記事」で作成し、メモリにトンマナ・テンプレ・NG規程・内部リンク方針を常駐。
- weekly スケジュールで「未着手KWキューから1〜2本の構成＋比較表＋FAQ＋SEO骨子を生成し`/drafts/`に保存」。
- 人は仕上げ（露骨表現の付与・事実確認）を行い、コンプラ点検（作業3）に回す。

**(c) コンプラ自己点検（公開ゲート）**

- スキル/サブエージェント化し、公開直前に必ず走らせる「ゲート」に。薬機法・景表法・PR表記（ステマ規制）の観点でフラグ→人が承認して初めて公開。

**(d) 週次KPI集計（自動＋アーティファクト）**

- weekly スケジュールでASP/GAデータを集計→`tracker.xlsx`更新。
- 加えて Cowork **アーティファクト**で「流入・CV・継続報酬」の常設ダッシュボードを作り、開くたび最新化。人は週1で5分確認。

## C-3. 人間が見るべきチェックポイント（最小化設計）

片手間運用の要は「人間の介入点を"公開ゲート"と"週次レビュー"の2点に絞る」こと。

1. **公開ゲート（記事ごと・必須）** — コンプラ点検結果の承認＋露骨表現/訴求の最終確認。法的責任が残る唯一の必須手動点。所要5〜10分/本。
2. **週次レビュー（週1・15分）** — 定点調査の差分サマリ＋KPIダッシュボード＋（あれば）実装PRの承認。
3. それ以外（巡回・素材生成・集計・整形・投稿予約）は自動/半自動に寄せ、Claudeの自己検証（Stop/PostToolUseフック、サブエージェントの相互レビュー）で品質を担保。

**安全運用メモ:** 自動実行は「Ask before acting」から始め、信頼できた作業のみ「Act without asking」へ。削除は常に手動承認。アダルト領域はプラットフォーム規約変更が早いので、SNS投稿の規約適合だけは自動化しすぎない。

---

## 確認できなかった / 要確認の項目

- **アダルトコンテンツに対する各ツールの具体的な拒否境界**：Usage Policy上、露骨な性的本文の生成は制限される可能性が高いが、「どこまでが可」の明確な線引きは公式に個別文書化されていない（**要確認・実機テスト推奨**）。
- **Cowork スケジュールタスクのアダルト系サイト操作の可否**：egress設定・サイト規約依存。要実機確認。
- **Claude in Chrome のアダルトサイト上での自動操作可否**：admin allowlist/blocklistおよび高リスクサイト判定の対象になり得る（**要確認**）。
- 各機能のプラン要件（Dynamic Workflowsは Enterprise/Team/Max、Chromeのモデルはプラン依存等）は本人の契約プランで再確認のこと。

---

### 主要ソース一覧（すべて確認日 2026-06-27）

- Claude Code を自走化（checkpoints/subagents/hooks/background）: https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously （投稿日 2025-09-29）
- Claude Code power user tips（/loop・/schedule・/batch・auto mode・sandbox等）: https://support.claude.com/en/articles/14554000-claude-code-power-user-tips
- ダイナミックワークフロー: https://code.claude.com/docs/en/workflows
- カスタムサブエージェント: https://docs.claude.com/en/docs/claude-code/sub-agents
- Cowork 入門（機能・制約）: https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- Cowork 定期タスク（投稿日 2026-04-09）: https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
- Cowork プラグイン: https://support.claude.com/en/articles/13837440-use-plugins-in-cowork
- Claude in Chrome 入門（投稿日 2026-04-27）: https://support.claude.com/en/articles/12012173-get-started-with-claude-in-chrome
- Opus 4.8 紹介: https://www.anthropic.com/news/claude-opus-4-8
