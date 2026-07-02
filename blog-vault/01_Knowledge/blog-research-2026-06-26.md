# ブログ制作の効率化研究 — Claude Code / Cowork

調査日: 2026-06-26
対象: AI・個人開発・多エージェント運用を書く個人ブロガー / ファイルを直接読み書きさせる運用前提

**凡例**
- **検証済み** = Anthropic公式ドキュメント(code.claude.com / platform.claude.com)で確認済み
- **要確認** = 公式で裏が取れていない、または Cowork 固有挙動で未確認

> 注: 公式ドキュメントは "Claude Code" 名義。Cowork は同じエンジン上の研究プレビューで、CLAUDE.md・サブエージェント・スキル・コスト管理など基盤機構は共通だが、**Cowork 固有のUI/対応状況は公式に明記されていないため、Cowork 単体の挙動は「要確認」**として扱う。

---

## 観点① 下書き〜推敲を任せつつ文体ルールを守らせる

### CLAUDE.md(プロジェクトメモリ)
- **できること**: プロジェクト直下の `./CLAUDE.md` または `./.claude/CLAUDE.md` に書いた指示が、毎セッション開始時にコンテキストへ全文ロードされる。文体規約・禁止表現・トーンなど「毎回言い直す内容」を恒久指示にできる。
- **ブログ制作への当てはめ**: 「常体/敬体」「一文の最大長」「使わない語(例: 〜していきましょう)」「見出しの語尾統一」などの文体規約を `CLAUDE.md` に箇条書きで定義。下書き・推敲タスクで自動的に守らせる。
- **出典**: https://code.claude.com/docs/en/memory
- **バージョン依存・非推奨**: なし(基本機能)。**強制ではなく「コンテキスト」**である点に注意(下記)。

### 効果的な書き方(具体・簡潔・構造化)
- **できること**: 公式は「200行以内を目安」「具体的で検証可能な指示」「markdown見出し+箇条書きで構造化」「矛盾する指示を置かない」を推奨。曖昧・冗長・矛盾は遵守率を下げる。
- **ブログ制作への当てはめ**: 文体規約は「丁寧に書く」ではなく「文末は『です・ます』。体言止めは1記事3回まで」のように検証可能な形で書く。規約が増えたら下記 `.claude/rules/` かスキルへ分割。
- **出典**: https://code.claude.com/docs/en/memory (Write effective instructions)
- **バージョン依存・非推奨**: なし。

### `.claude/rules/`(パス別ルール)
- **できること**: `.claude/rules/*.md` に話題別でルールを分割管理。YAML frontmatter の `paths` で対象ファイルを絞れば、該当ファイルを触る時だけコンテキストにロードされる。
- **ブログ制作への当てはめ**: `rules/style-ja.md`(文体)、`rules/seo.md`(構成規約)等に分割。`paths: ["03_drafts/**/*.md"]` のように下書きフォルダ限定でロードし、無関係作業中はコンテキストを消費しない。
- **出典**: https://code.claude.com/docs/en/memory (Organize rules with `.claude/rules/`)
- **バージョン依存・非推奨**: なし。

### CLAUDE.md は「強制」ではない → 確実に守らせたいなら hook
- **できること**: 公式明記。CLAUDE.md/メモリはシステムプロンプト後に user メッセージとして渡る「コンテキスト」で、厳密遵守の保証はない。特定タイミングで必ず実行したい処理は **PreToolUse hook** で行う。
- **ブログ制作への当てはめ**: 文体は CLAUDE.md で誘導しつつ、機械判定できるチェック(禁止語の grep、文字数上限、textlint 等)は保存前 hook で実行して機械的に弾く。文体ルールの「遵守保証」を CLAUDE.md 単独に頼らない。
- **出典**: https://code.claude.com/docs/en/memory (CLAUDE.md vs auto memory) / https://code.claude.com/docs/en/hooks-guide
- **バージョン依存・非推奨**: なし。

### `/init` でCLAUDE.md雛形生成
- **できること**: `/init` でリポジトリを解析しCLAUDE.md雛形を自動生成。既存があれば上書きせず改善提案。`CLAUDE_CODE_NEW_INIT=1` で対話的マルチフェーズ版(CLAUDE.md/スキル/hookをまとめて設計)。
- **ブログ制作への当てはめ**: ブログvault(Obsidian)直下で `/init` を一度走らせ、フォルダ構成(01_research/02_outlines/03_drafts等)を認識させた土台を作り、そこに文体規約を追記。
- **出典**: https://code.claude.com/docs/en/memory (Set up a project CLAUDE.md)
- **バージョン依存・非推奨**: `CLAUDE_CODE_NEW_INIT=1` はオプトインの新フロー(要確認: 既定化時期)。

### Auto memory(自動メモリ)
- **できること**: ユーザーの訂正・好みからClaude自身が学びを `~/.claude/projects/<project>/memory/` に蓄積。`MEMORY.md` の先頭200行(or 25KB)が毎セッションロード。既定ON、`/memory` でトグル可。
- **ブログ制作への当てはめ**: 推敲中に「この言い回しは使わない」と訂正を重ねると、Claudeが好みを自動記憶し回数を追うごとに文体が安定。`/memory` で内容を監査・編集。
- **出典**: https://code.claude.com/docs/en/memory (Auto memory)
- **バージョン依存・非推奨**: **要 v2.1.59 以上**。`CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` または `autoMemoryEnabled:false` で無効化。

---

## 観点② 製品スペックの裏取りを公式docで自動化

### WebSearch(検索)+ WebFetch(取得)の二段構え
- **できること**: WebSearch は Anthropic のバックエンドに対しクエリを投げ、タイトルとURLを返す(ページ本文は取得しない/1コールで最大8回内部検索)。WebFetch は URL を取得しMarkdown化して小型モデルでプロンプト抽出する。
- **ブログ制作への当てはめ**: 「製品名 仕様 公式」で WebSearch → 公式ドメインのURLを WebFetch して数値を抽出、の流れを定型化。スペック記事の裏取りを自動巡回させる。
- **出典**: https://code.claude.com/docs/en/tools-reference (WebSearch/WebFetch tool behavior)
- **バージョン依存・非推奨**: WebSearch は **Bedrock では非対応**(Vertex は Claude 4系、Foundry/APIは可)。WebFetch/WebSearch は権限要(Yes)。

### WebFetch の挙動上の注意(lossy・キャッシュ・リダイレクト)
- **できること**: WebFetch は抽出プロンプトを通すため**設計上ロッシー**。「記載なし」は抽出プロンプトが訊いていないだけの可能性がある。同一URLは15分キャッシュ。別ホストへのリダイレクトは追従せず、リダイレクト先URLを返す(再フェッチが必要)。
- **ブログ制作への当てはめ**: スペック裏取りでは抽出プロンプトを具体化(「価格・発売日・対応OSを表で」)。取りこぼし時は質問を変えて再フェッチ、または生ページが要る時は Bash の `curl` で取得。リダイレクトされたら返ってきたURLを再フェッチ。
- **出典**: https://code.claude.com/docs/en/tools-reference (WebFetch tool behavior)
- **バージョン依存・非推奨**: なし。

### WebFetch のドメイン事前承認 / プリ承認ドキュメントドメイン
- **できること**: default/acceptEdits モードでは新規ドメイン初回にプロンプトが出る。ただし**公式ドキュメント系の事前承認ドメイン群はプロンプトなしで取得**。`WebFetch(domain:example.com)` を allow に入れれば事前許可、deny で遮断もできる。
- **ブログ制作への当てはめ**: よく裏取りに使う公式ドメイン(メーカーやドキュメントサイト)を `permissions.allow` に登録しておけば、巡回時に毎回確認が出ず自走しやすい。
- **出典**: https://code.claude.com/docs/en/tools-reference (WebFetch) / https://code.claude.com/docs/en/permissions#webfetch
- **バージョン依存・非推奨**: なし。

### MCPサーバで検索プロバイダ/一次情報源を差し替え
- **できること**: WebSearch のバックエンドは固定。別プロバイダで検索したい・特定DBを引きたい場合は MCP サーバを追加してツール化できる。MCPツール定義は既定で deferred(名前のみロード)。
- **ブログ制作への当てはめ**: メーカー公式API・データベース等の一次情報源をMCP化すれば、Web検索より正確にスペック裏取りを自動化できる。`/mcp` で接続管理。
- **出典**: https://code.claude.com/docs/en/tools-reference (WebSearch note) / https://code.claude.com/docs/en/mcp
- **バージョン依存・非推奨**: tool search(deferred)関連は設定依存。

> **裏取りの原則**: WebFetch はロッシーなので、数値・価格・日付など重要事実は「抽出結果」ではなく**一次ソースURLを記事に残し人間が再確認**するのが安全(本研究と同様の運用)。

---

## 観点③ 複数記事の見出し・構成を一括で揃える(自走機能)

### サブエージェント(Agent ツール)
- **できること**: 独自コンテキストウィンドウ・専用システムプロンプト・限定ツール権限を持つ別Claudeにタスクを委譲し、要約だけを親に返す。`.claude/agents/` 等で定義し、説明文に合致するとClaudeが自動委譲する。
- **ブログ制作への当てはめ**: 「見出し統一エージェント」を定義(構成規約を持たせる)。複数記事をまとめて渡し、各記事の見出し階層・語尾・順序を規約準拠に揃えさせる。検索ログ等で本流コンテキストを汚さない。
- **出典**: https://code.claude.com/docs/en/sub-agents / https://code.claude.com/docs/en/tools-reference (Agent tool behavior)
- **バージョン依存・非推奨**: 背景サブエージェントの権限プロンプト表示は **v2.1.186 以上**(以前は自動拒否)。

### Workflow ツール(`/workflows` / 動的ワークフロー)
- **できること**: 多数のサブエージェントを背景でオーケストレーションし、統合された結果を1つ返すスクリプト。多段の定型処理を1コマンドで起動できる。
- **ブログ制作への当てはめ**: 「全記事スキャン→見出し抽出→規約差分検出→各記事を並列修正→統合レポート」を1ワークフロー化し、記事一括統一を自走させる。
- **出典**: https://code.claude.com/docs/en/tools-reference (Workflow) / https://code.claude.com/docs/en/workflows
- **バージョン依存・非推奨**: 権限要(Yes)。詳細仕様は要確認(workflows ページ)。

### スキル(SKILL.md)/ カスタムコマンドの統合
- **できること**: `.claude/skills/<name>/SKILL.md` に手順を書くと `/name` で起動でき、Claudeが関連時に自動ロードもする。本文は使用時のみロードされコンテキストをほぼ消費しない。**旧 `.claude/commands/*.md` はスキルに統合**(両方とも動作)。`$ARGUMENTS`/`$N` で引数を渡せる。
- **ブログ制作への当てはめ**: `/normalize-headings`(構成統一)、`/outline`(見出し雛形生成)等を作り、記事パスを引数で渡して反復実行。文体規約より「手順」はスキルへ寄せ、CLAUDE.md を軽く保つ。
- **出典**: https://code.claude.com/docs/en/skills
- **バージョン依存・非推奨**: カスタムコマンドはスキルに統合(旧 `commands/` は後方互換で継続)。

### スキルをサブエージェントで実行(`context: fork`)
- **できること**: SKILL.md frontmatter に `context: fork` を付けると、スキル本文をプロンプトとして別コンテキストの subagent が実行(会話履歴は引き継がない)。Explore/Plan エージェント型は CLAUDE.md/git status を読まず軽量。
- **ブログ制作への当てはめ**: 「全記事の見出し棚卸し」など読み取り中心の重い走査を `context: fork` + Explore で実行し、結果サマリだけ受け取る。本流の枠を温存。
- **出典**: https://code.claude.com/docs/en/skills (Run skills in a subagent)
- **バージョン依存・非推奨**: `context: fork` はタスク明示のスキル限定(ガイドラインのみのスキルでは無意味)。

### サブエージェントの自動起動を絞る(side-effectの暴発防止)
- **できること**: `disable-model-invocation: true` でユーザー起動限定、`user-invocable: false` でClaude起動限定にできる。
- **ブログ制作への当てはめ**: 「公開」「一括上書き」のような副作用のある一括処理は `disable-model-invocation:true` にして、Claudeが勝手に走らせないようにする。
- **出典**: https://code.claude.com/docs/en/skills (Control who invokes a skill)
- **バージョン依存・非推奨**: なし。

---

## 観点④ 枠/コスト消費の注意点

### 使用量の可視化(`/context` `/usage` `/stats`)
- **できること**: `/context` はシステムプロンプト/ツール/MCP/メモリ/スキル/メッセージ等の内訳トークンを表示。`/usage` はプラン上限とレート状況・セッションのトークン/コスト推定を表示。`/stats` はヒートマップ等のダッシュボード。
- **ブログ制作への当てはめ**: 長い推敲セッション前後で `/context` を見て、CLAUDE.md やMCPがコンテキストを食い過ぎていないか点検。ステータスラインに常時表示も可。
- **出典**: https://code.claude.com/docs/en/costs (Track your costs)
- **バージョン依存・非推奨**: `/usage` のドル表示はAPIユーザー向けで、Max/Pro購読者の課金には非該当(ローカル推定値・他端末/claude.ai分は含まない)。VS Code内訳は **v2.1.174 以上**。

### コンテキストを能動的に管理(`/clear` `/compact` `/rewind`)
- **できること**: `/clear` で無関係タスク切替時にリセット(古い文脈は毎メッセージで無駄消費)。`/compact 〜` で要約時の保持対象を指定。CLAUDE.md に compact 指示も書ける。誤方向は Esc 中断・`/rewind` で巻き戻し。
- **ブログ制作への当てはめ**: 記事ごとに `/clear`(`/rename`→`/resume` で後から復帰)。推敲では `/compact コードと文体指摘を優先` のように保持対象を指定して枠を節約。
- **出典**: https://code.claude.com/docs/en/costs (Manage context proactively)
- **バージョン依存・非推奨**: project-root の CLAUDE.md は compaction を生存(再読込)、サブディレクトリの nested CLAUDE.md は自動再注入されない。

### モデル選択・extended thinking の調整
- **できること**: Sonnet は大半のタスクで十分かつ安価、Opus は複雑な設計向け(`/model` で切替)。サブエージェントは `model: haiku` 指定可。extended thinking は既定ONで出力トークン課金、`/effort` 等で削減可。
- **ブログ制作への当てはめ**: 下書き・見出し統一など定型は Sonnet/Haiku サブエージェント、構成設計だけ Opus。単純作業では thinking の effort を下げてコスト圧縮。
- **出典**: https://code.claude.com/docs/en/costs (Choose the right model / Adjust extended thinking)
- **バージョン依存・非推奨**: Fable 5 は thinking 無効化不可(常時extended)。adaptive-reasoning モデルは budget無視→effortで調整。

### CLAUDE.md は軽く・手順はスキル/hookへ退避
- **できること**: CLAUDE.md は毎セッション全文ロードでトークンを常時消費。詳細手順はオンデマンドロードのスキルへ、ログ整形等は hook で前処理してClaudeが見る量を削減。MCP未使用サーバは `/mcp` で無効化。
- **ブログ制作への当てはめ**: 文体規約は短く、`/normalize-headings` 等の長手順はスキル化。textlint結果は hook で要点だけ渡す。CLAUDE.md は **200行以内**を維持。
- **出典**: https://code.claude.com/docs/en/costs (Reduce token usage / Offload to hooks and skills)
- **バージョン依存・非推奨**: なし。

### 並列・多エージェント運用のコスト爆発に注意
- **できること**: サブエージェント/Agent teams は各自が独立コンテキストを持つため、トークンはおおむね台数×稼働時間に比例。Agent teams は plan モード時に**標準セッションの約7倍**のトークンを使う。
- **ブログ制作への当てはめ**: 多記事を多エージェントで一括処理する時は台数を絞り、teammate は Sonnet、終わったら速やかに停止。spawn プロンプトを短く保つ(CLAUDE.md/MCP/スキルは自動ロードされ初期コンテキストに乗る)。
- **出典**: https://code.claude.com/docs/en/costs (Agent team token costs / Manage agent team costs)
- **バージョン依存・非推奨**: Agent teams は既定無効、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` で有効化(実験的)。

### レート制限・枠の目安
- **できること**: 企業導入の平均は約 $13/開発者/稼働日、$150–250/月(90%は$30/稼働日未満)。チーム規模別にTPM/RPMの推奨値あり(例: 1–5人で200k–300k TPM, 5–7 RPM/人)。背景処理(要約・コマンド)も通常$0.04/セッション未満を消費。
- **ブログ制作への当てはめ**: 個人運用なら $13/日 を上限の目安に、`/usage` でレート状況を確認しつつ多エージェントの同時実行数を調整。Pro/Max は `/usage-credits` で月次上限も設定可。
- **出典**: https://code.claude.com/docs/en/costs (Rate limit recommendations / Background token usage) / https://claude.com/pricing
- **バージョン依存・非推奨**: 数値は企業導入の平均で個人ブログ用途と異なる可能性(目安として扱う)。

---

## Cowork 固有(要確認)

- 本研究の公式根拠はすべて **Claude Code ドキュメント**。Cowork は同エンジン上の研究プレビューで、ファイル直接読み書き・スキル・サブエージェント・コスト管理を共有するが、**Cowork のUI上で `/context` `/usage` 等のコマンドや CLAUDE.md 配置がどう露出するかは公式に未確認**。
- 上記①〜④の手法はエンジン共通機能のため Cowork でも有効と推測されるが、**Cowork固有の対応状況・枠の数え方は公式ドキュメントで裏が取れていない=要確認**。
- 確認先候補: https://docs.claude.com / https://support.claude.com(Cowork のヘルプ記事。今回アクセス未取得)。

---

## 出典一覧
- メモリ/CLAUDE.md: https://code.claude.com/docs/en/memory
- サブエージェント: https://code.claude.com/docs/en/sub-agents
- スキル: https://code.claude.com/docs/en/skills
- ツールリファレンス(WebFetch/WebSearch/Agent/Workflow): https://code.claude.com/docs/en/tools-reference
- コスト管理: https://code.claude.com/docs/en/costs
- hook ガイド: https://code.claude.com/docs/en/hooks-guide
- 権限(WebFetchドメイン等): https://code.claude.com/docs/en/permissions
- MCP: https://code.claude.com/docs/en/mcp
- ワークフロー: https://code.claude.com/docs/en/workflows
- 料金: https://claude.com/pricing
