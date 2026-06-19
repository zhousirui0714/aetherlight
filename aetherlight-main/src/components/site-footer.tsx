export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="seal text-sm">溯光</span>
            <span className="font-serif text-base tracking-widest text-foreground/80">关于溯光</span>
          </div>
          <p className="text-sm leading-loose text-muted-foreground">
            溯历史长河，撷文明之光。<br />
            以 AI 之力，活化中国传统文化，<br />
            让千年智慧重现于当下。
          </p>
        </div>
        <div>
          <h4 className="mb-4 font-serif text-base tracking-widest text-foreground/80">联系方式</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>邮箱：hello@suguang.cn</li>
            <li>微信公众号：溯光文化</li>
            <li>商务合作：bd@suguang.cn</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-serif text-base tracking-widest text-foreground/80">友情链接</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a className="hover:text-primary" href="#">中国国家图书馆</a></li>
            <li><a className="hover:text-primary" href="#">故宫博物院</a></li>
            <li><a className="hover:text-primary" href="#">中华诗词网</a></li>
            <li><a className="hover:text-primary" href="#">非遗保护中心</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} 溯光 SuGuang · 致敬千年文明</span>
          <span className="font-serif tracking-[0.3em]">墨 · 韵 · 光</span>
        </div>
      </div>
    </footer>
  );
}
